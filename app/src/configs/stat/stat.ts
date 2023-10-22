import { S3_CONFIG } from '../aws/s3.js';

export const APP_PDF_URL = (pdfId: number): string =>
  `https://stat.42seoul.kr/${S3_CONFIG.pdfPathById(pdfId)}`;
