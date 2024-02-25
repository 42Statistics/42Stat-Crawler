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
  const prevSecret = await secretsManagerHandle.getSecretValue(
    deployConfig.secretId
  );

  if (prevSecret && prevSecret[deployConfig.secretKey] === nextSecret) {
    console.log('Secret is already up to date');

    return;
  }

  await secretsManagerHandle.putSecretValue(deployConfig.secretId, {
    [deployConfig.secretKey]: nextSecret,
  });
};
