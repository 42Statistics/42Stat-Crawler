import * as SecretsManager from '@aws-sdk/client-secrets-manager';
import { AWS_REGION } from '../../configs/aws/region.js';

export type SecretsManagerHandle = {
  getSecretValue: (
    secretId: string
  ) => Promise<Record<string, string> | undefined>;

  putSecretValue: (
    secretId: string,
    secrets: Record<string, string>
  ) => Promise<void>;
};

class SecretsManagerHandleImpl implements SecretsManagerHandle {
  private readonly secretsManagerClient: SecretsManager.SecretsManagerClient;

  constructor(secretsManagerClient: SecretsManager.SecretsManagerClient) {
    this.secretsManagerClient = secretsManagerClient;
  }

  async getSecretValue(
    secretId: string
  ): Promise<Record<string, string> | undefined> {
    const result = await this.secretsManagerClient.send(
      new SecretsManager.GetSecretValueCommand({
        SecretId: secretId,
      })
    );

    if (!result.SecretString) {
      return undefined;
    }

    return JSON.parse(result.SecretString) as Record<string, string>;
  }

  async putSecretValue(
    secretId: string,
    secrets: Record<string, string>
  ): Promise<void> {
    await this.secretsManagerClient.send(
      new SecretsManager.PutSecretValueCommand({
        SecretId: secretId,
        SecretString: JSON.stringify(secrets),
      })
    );
  }
}

export const createSecretsManagerHandle = (): {
  secretsManagerHandle: SecretsManagerHandleImpl;
} & Disposable => {
  const secretsManagerClient = new SecretsManager.SecretsManagerClient({
    region: AWS_REGION,
  });

  return {
    secretsManagerHandle: new SecretsManagerHandleImpl(secretsManagerClient),
    [Symbol.dispose]: (): void => secretsManagerClient.destroy(),
  };
};
