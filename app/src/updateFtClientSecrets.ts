import { APP_DEV_CONFIG } from './configs/ftClient/app.dev.js';
import { APP_LOCAL_CONFIG } from './configs/ftClient/app.local.js';
import { APP_PROD_CONFIG } from './configs/ftClient/app.prod.js';
import { LAMBDA_CONFIG } from './configs/ftClient/lambda.js';
import { FtClientConfig } from './configs/ftClient/types.js';
import { BrowserFactory } from './libs/Browser.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { getOrThrowEnv } from './libs/getOrThrowEnv.js';
import { createSecretsManagerHandle } from './reciepes/aws/SecretsmanagerHandle.js';
import { FtApiClientHandle } from './reciepes/ft/FtApiClientHandle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';

const GITHUB_TOKEN = getOrThrowEnv('CRAWLER_GITHUB_AUTH');
const UPDATE_CLIENT_SECRET_MESSAGE =
  'chore: :closed_lock_with_key: 42 client secret 갱신';

const FT_USERNAME = getOrThrowEnv('FT_USERNAME');
const FT_PASSWORD = getOrThrowEnv('FT_PASSWORD');

const updateFtClientSecrets = async (): Promise<void> => {
  const SERVICE_CONFIGS = [
    APP_PROD_CONFIG,
    APP_DEV_CONFIG,
    APP_LOCAL_CONFIG,
    LAMBDA_CONFIG,
  ];

  await using browser = await BrowserFactory.createInstance();

  {
    await using ftApiClientHandleInstance =
      await FtApiClientHandle.createInstance({
        browser: browser.browserHandle,
        loginHandle: new LoginHandle(
          new FtLoginStrategy(FT_USERNAME, FT_PASSWORD)
        ),
      });

    const ftApiClientHandle = ftApiClientHandleInstance.ftApiClientHandle;

    // #region 다음 42 client secret fetch
    for (const { ftClientConfig } of SERVICE_CONFIGS) {
      ftClientConfig.nextSecret = await ftApiClientHandle.getNextSecret(
        ftClientConfig.id
      );
    }
    // #endregion

    // #region aws secrets manager 를 통해 갱신
    using secretsManager = createSecretsManagerHandle();

    for (const serviceConfig of SERVICE_CONFIGS) {
      if (!hasNextSecret(serviceConfig.ftClientConfig)) {
        console.log(
          `no need to update ${serviceConfig.githubConfig.main.repo}/${serviceConfig.ftClientConfig.id}`
        );

        continue;
      }

      secretsManager.secretsManagerHandle.putSecretValue();
    }
    // #endregion
  }
};

type FtClientConfigWithNextSecret = Required<FtClientConfig>;

const hasNextSecret = (
  ftClientConfig: FtClientConfig
): ftClientConfig is FtClientConfigWithNextSecret => {
  return ftClientConfig.nextSecret !== undefined;
};

await updateFtClientSecrets();
