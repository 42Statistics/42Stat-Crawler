import type { AwsSecretsManagerDeployable } from '../../configs/ftClient/serviceConfig.js';
import type { SecretsManagerHandle } from '../aws/SecretsManagerHandle.js';

export const deployByAwsSecretsManager = async ({
  secretsManagerHandle,
  deployConfig,
  nextSecret,
}: {
  secretsManagerHandle: SecretsManagerHandle;
  deployConfig: AwsSecretsManagerDeployable;
  nextSecret: string;
}): Promise<void> => {
  await secretsManagerHandle.putSecretValue(deployConfig.secretId, {
    [deployConfig.secretKey]: nextSecret,
  });
};
