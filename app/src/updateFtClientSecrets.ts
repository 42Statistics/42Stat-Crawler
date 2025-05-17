import { APP_DEV_CONFIG } from './configs/ftClient/app.dev.js';
import { APP_LOCAL_CONFIG } from './configs/ftClient/app.local.js';
import { APP_PROD_CONFIG } from './configs/ftClient/app.prod.js';
import {
  LAMBDA_CONFIG,
  LAMBDA_EVENTBRIDGE_RULE_NAME,
} from './configs/ftClient/lambda.js';
import { FT_PASSWORD, FT_USERNAME } from './configs/ftUser/ftUserCredential.js';
import { GITHUB_TOKEN } from './configs/github/github.js';
import { BrowserFactory } from './libs/Browser.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { createEventbridgeHandle } from './reciepes/aws/EventbridgeHandle.js';
import {
  SecretsManagerHandle,
  createSecretsManagerHandle,
} from './reciepes/aws/SecretsManagerHandle.js';
import { FtApiClientHandle } from './reciepes/ft/FtApiClientHandle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { GithubHandle } from './reciepes/github/GithubHandle.js';
import { deployByAwsSecretsManager } from './reciepes/stat/deployByAwsSecretsManager.js';

type AwsDeployableArguments = {
  ftApiClientHandle: FtApiClientHandle;
  secretsManagerHandle: SecretsManagerHandle;
  nextSecret: string;
};

const SERVICE_CONFIGS = [
  {
    config: APP_PROD_CONFIG,
    deployFn: async ({
      secretsManagerHandle,
      nextSecret,
    }: AwsDeployableArguments): Promise<void> => {
      await deployByAwsSecretsManager({
        secretsManagerHandle,
        deployConfig: APP_PROD_CONFIG.deployConfig,
        nextSecret,
      });
    },
  },
  {
    config: APP_DEV_CONFIG,
    deployFn: async ({
      secretsManagerHandle,
      nextSecret,
    }: AwsDeployableArguments): Promise<void> => {
      await deployByAwsSecretsManager({
        secretsManagerHandle,
        deployConfig: APP_DEV_CONFIG.deployConfig,
        nextSecret,
      });
    },
  },
  {
    config: APP_LOCAL_CONFIG,
    deployFn: async ({
      secretsManagerHandle,
      nextSecret,
    }: AwsDeployableArguments): Promise<void> => {
      await deployByAwsSecretsManager({
        secretsManagerHandle,
        deployConfig: APP_LOCAL_CONFIG.deployConfig,
        nextSecret,
      });
    },
  },
  {
    config: LAMBDA_CONFIG,
    deployFn: async ({
      secretsManagerHandle,
      nextSecret,
    }: {
      ftApiClientHandle: FtApiClientHandle;
      secretsManagerHandle: SecretsManagerHandle;
      nextSecret: string;
    }): Promise<void> => {
      using eventbridge = createEventbridgeHandle();
      await eventbridge.eventbridgeHandle.disableRule(
        LAMBDA_EVENTBRIDGE_RULE_NAME
      );

      await deployByAwsSecretsManager({
        secretsManagerHandle,
        deployConfig: LAMBDA_CONFIG.deployConfig,
        nextSecret,
      });

      await eventbridge.eventbridgeHandle.enablleRule(
        LAMBDA_EVENTBRIDGE_RULE_NAME
      );
    },
  },
];

const updateFtClientSecrets = async (): Promise<void> => {
  await using browser = await BrowserFactory.createInstance();

  {
    using secretsManager = createSecretsManagerHandle();

    await using ftApiClient = await FtApiClientHandle.createInstance({
      browser: browser.browserHandle,
      loginHandle: new LoginHandle(
        new FtLoginStrategy(FT_USERNAME, FT_PASSWORD)
      ),
    });

    const ftApiClientHandle = ftApiClient.ftApiClientHandle;
    const githubHandle = new GithubHandle(GITHUB_TOKEN);

    // #region 다음 42 client secret fetch
    for (const { config, deployFn } of SERVICE_CONFIGS) {
      console.log(`checking ${config.ftClientConfig.id}`);

      const nextSecret = await ftApiClientHandle.getNextSecret(
        config.ftClientConfig.id
      );

      if (!nextSecret) {
        console.log(`no need to update ${config.ftClientConfig.id}`);

        continue;
      }

      console.log(`updating ${config.ftClientConfig.id}`);

      const deployArgs = {
        githubHandle,
        ftApiClientHandle,
        secretsManagerHandle: secretsManager.secretsManagerHandle,
        nextSecret,
      } as const;

      await deployFn(deployArgs);

      console.log('deploy done');
    }
  }

  console.log('done');
  process.exit(0);
};

await updateFtClientSecrets();
