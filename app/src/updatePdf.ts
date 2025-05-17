import { S3_CONFIG } from './configs/aws/s3.js';
import { FT_PASSWORD, FT_USERNAME } from './configs/ftUser/ftUserCredential.js';
import { MONGO_CONFIG, type DocumentWithId } from './configs/mongo/mongo.js';
import { APP_PDF_URL } from './configs/stat/stat.js';
import { BrowserFactory } from './libs/Browser.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { createMongoClient } from './libs/createMongoClient.js';
import { createS3Handle } from './reciepes/aws/S3Handle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { FtProjectHandle } from './reciepes/ft/FtProjectHandle.js';

const updatePdf = async (): Promise<void> => {
  await using browser = await BrowserFactory.createInstance();

  {
    await using mongo = await createMongoClient(MONGO_CONFIG.mongodbUrl);

    await using ftProjectHandleInstance = await FtProjectHandle.createInstance({
      browser: browser.browserHandle,
      loginHandle: new LoginHandle(
        new FtLoginStrategy(FT_USERNAME, FT_PASSWORD)
      ),
    });

    using s3 = createS3Handle();

    const projectIds = await mongo.mongoHandle
      .db()
      .collection(MONGO_CONFIG.projectsCollection)
      .find<DocumentWithId>({}, { projection: { id: 1 } })
      .map((doc) => doc.id)
      .toArray();

    for (const projectId of projectIds) {
      const pdfInfo =
        await ftProjectHandleInstance.ftProjectHandle.getPdfInfo(projectId);

      if (!pdfInfo) {
        continue;
      }

      const isExist = await s3.s3Handle.checkObjectAccessOk({
        bucket: S3_CONFIG.bucketName,
        key: S3_CONFIG.pdfPath(projectId, pdfInfo.id),
      });

      if (isExist) {
        continue;
      }

      const pdfContentResponse = await fetch(pdfInfo.url);
      if (!pdfContentResponse.ok) {
        continue;
      }

      const pdfContent = Buffer.from(await pdfContentResponse.arrayBuffer());

      await s3.s3Handle.putObject({
        path: S3_CONFIG.pdfPath(projectId, pdfInfo.id),
        content: pdfContent,
        contentType: 'application/pdf',
        cache: { enable: true },
      });

      await mongo.mongoHandle
        .db()
        .collection(MONGO_CONFIG.projectsCollection)
        .updateOne(
          {
            id: projectId,
          },
          {
            $set: {
              [MONGO_CONFIG.pdfUrlField]: APP_PDF_URL(projectId, pdfInfo.id),
            },
          }
        );

      console.log(`update pdf url for project id: ${projectId}`);
    }
  }

  console.log('done');
  process.exit(0);
};

await updatePdf();
