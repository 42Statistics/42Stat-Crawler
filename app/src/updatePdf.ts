import { FT_PASSWORD, FT_USERNAME } from './configs/ftUser/credential.js';
import { PROD_MONGODB_URL } from './configs/mongo/prod.js';
import { BrowserFactory } from './libs/Browser.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { createMongoClient } from './libs/createMongoClient.js';
import { createS3Handle } from './reciepes/aws/S3Handle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { FtProjectHandle } from './reciepes/ft/FtProjectHandle.js';

const PDF_CDN_PATH = (pdfId: number): string => `temp/cdn/pdfs/${pdfId}.pdf`;

const APP_PDF_URL = (pdfId: number): string =>
  `https://stat.42seoul.kr/${PDF_CDN_PATH(pdfId)}`;

const updatePdf = async (): Promise<void> => {
  await using mongo = await createMongoClient(PROD_MONGODB_URL);
  await using browser = await BrowserFactory.createInstance();

  {
    await using ftProjectHandleInstance = await FtProjectHandle.createInstance({
      browser: browser.browserHandle,
      loginHandle: new LoginHandle(
        new FtLoginStrategy(FT_USERNAME, FT_PASSWORD)
      ),
    });

    using s3 = createS3Handle();

    const projectIdCursor = mongo.mongoHandle
      .db()
      .collection('projects_temp')
      .find<{ id: number }>({}, { projection: { id: 1 } });

    for await (const { id: projectId } of projectIdCursor) {
      const pdf =
        await ftProjectHandleInstance.ftProjectHandle.getPdf(projectId);

      if (!pdf) {
        continue;
      }

      await s3.s3Handle.putObject({
        path: PDF_CDN_PATH(pdf.id),
        content: pdf.content,
        contentType: 'application/pdf',
        cache: { enable: true },
      });

      await mongo.mongoHandle
        .db()
        .collection('projects_temp')
        .updateOne(
          {
            id: projectId,
          },
          {
            $set: {
              pdfUrl: APP_PDF_URL(pdf.id),
            },
          }
        );
    }
  }
};

await updatePdf();
