import { S3_CONFIG } from '../aws/s3.js';

export const APP_PDF_URL = (projectId: number, pdfId: number): string =>
  `https://stat.42seoul.kr/${S3_CONFIG.pdfPath(projectId, pdfId)}`;
