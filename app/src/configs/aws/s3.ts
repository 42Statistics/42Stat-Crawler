export const S3_CONFIG = {
  defaultCacheControl: 'max-age=86400, stale-if-error=86400',
  bucketName: '42stat-s3-bucket',
  pdfPathById: (pdfId: number): string => `cdn/pdfs/${pdfId}.pdf`,
} as const;