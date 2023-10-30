import * as S3 from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { AWS_REGION } from '../../configs/aws/region.js';
import { S3_CONFIG } from '../../configs/aws/s3.js';

class S3Handle {
  private readonly s3Client: S3.S3Client;

  constructor(s3Client: S3.S3Client) {
    this.s3Client = s3Client;
  }

  async checkObjectAccessOk({
    bucket,
    key,
  }: {
    bucket: string;
    key?: string;
  }): Promise<boolean> {
    try {
      const response = await this.s3Client.send(
        new S3.HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      if (response.$metadata.httpStatusCode !== 200) {
        return false;
      }

      return true;
    } catch {
      // not found 같은 경우 exception 발생이 되기 때문에 아래와 같이 처리함
      return false;
    }
  }

  async putObject({
    path,
    content,
    contentType,
    cache,
  }: {
    path: string;
    content: string | Uint8Array | Buffer | Readable;
    contentType: string;
    cache: {
      enable: boolean;
      cacheControl?: string;
    };
  }): Promise<void> {
    await this.s3Client.send(
      new S3.PutObjectCommand({
        Bucket: S3_CONFIG.bucketName,
        Key: path,
        Body: content,
        ContentType: contentType,
        ...(cache.enable
          ? {
              CacheControl: cache.cacheControl ?? S3_CONFIG.defaultCacheControl,
            }
          : undefined),
      })
    );
  }
}

export const createS3Handle = (): {
  s3Handle: S3Handle;
} & Disposable => {
  const s3Client = new S3.S3Client({
    region: AWS_REGION,
  });

  return {
    s3Handle: new S3Handle(s3Client),
    [Symbol.dispose]: (): void => s3Client.destroy(),
  };
};
