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

    const projectIdCursor = mongo.mongoHandle
      .db()
      .collection(MONGO_CONFIG.projectsCollection)
      .find<DocumentWithId>({}, { projection: { id: 1 } });

    for await (const { id: projectId } of projectIdCursor) {
      const pdf =
        await ftProjectHandleInstance.ftProjectHandle.getPdf(projectId);

      if (!pdf) {
        continue;
      }

      await s3.s3Handle.putObject({
        path: S3_CONFIG.pdfPathById(pdf.id),
        content: pdf.content,
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
              [MONGO_CONFIG.pdfUrlField]: APP_PDF_URL(pdf.id),
            },
          }
        );
    }
  }
};

await updatePdf();
