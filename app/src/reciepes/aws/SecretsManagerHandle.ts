import * as SecretsManager from '@aws-sdk/client-secrets-manager';
import { AWS_REGION } from '../../configs/aws/region.js';

export type SecretsManagerHandle = {
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
