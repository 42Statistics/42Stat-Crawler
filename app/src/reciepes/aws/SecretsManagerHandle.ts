import * as SecretsManager from '@aws-sdk/client-secrets-manager';
import { AWS_REGION } from '../../configs/aws/region.js';

class SecretsManagerHandle {
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
  secretsManagerHandle: SecretsManagerHandle;
} & Disposable => {
  const secretsManagerClient = new SecretsManager.SecretsManagerClient({
    region: AWS_REGION,
  });

  return {
    secretsManagerHandle: new SecretsManagerHandle(secretsManagerClient),
    [Symbol.dispose]: (): void => secretsManagerClient.destroy(),
  };
};
