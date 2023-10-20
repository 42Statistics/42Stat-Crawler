import { APP_DEV_CONFIG } from './configs/ftClient/app.dev.js';
import { APP_PROD_CONFIG } from './configs/ftClient/app.prod.js';
import {
  LAMBDA_CONFIG,
  LAMBDA_EVENTBRIDGE_RULE_NAME,
} from './configs/ftClient/lambda.js';
import { FtClientConfig } from './configs/ftClient/types.js';
import { BrowserFactory } from './libs/Browser.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { getOrThrowEnv } from './libs/getOrThrowEnv.js';
import { createEventbridgeHandle } from './reciepes/aws/EventbridgeHandle.js';
import { FtApiClientHandle } from './reciepes/ft/FtApiClientHandle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { GithubHandle } from './reciepes/github/GithubHandle.js';
import { getNewEnvFileString } from './reciepes/stat/getNewEnvFileString.js';

const GITHUB_TOKEN = getOrThrowEnv('CRAWLER_GITHUB_AUTH');
const UPDATE_CLIENT_SECRET_MESSAGE =
  'chore: :closed_lock_with_key: 42 client secret 갱신';

const FT_USERNAME = getOrThrowEnv('FT_USERNAME');
const FT_PASSWORD = getOrThrowEnv('FT_PASSWORD');

const updateFtClientSecrets = async (): Promise<void> => {
  const SERVICE_CONFIGS = [APP_PROD_CONFIG, APP_DEV_CONFIG, LAMBDA_CONFIG];

  await using browser = await BrowserFactory.createInstance();

  const ftApiClientHandle = await FtApiClientHandle.createInstance({
    browser: browser.browserHandle,
    loginHandle: new LoginHandle(new FtLoginStrategy(FT_USERNAME, FT_PASSWORD)),
  });

  const githubHandle = new GithubHandle(GITHUB_TOKEN);

  // #region 다음 42 client secret fetch
  const ftClientConfigList = SERVICE_CONFIGS.reduce((acc, curr) => {
    return [...acc, ...curr.ftClientConfigs];
  }, new Array<FtClientConfig>());

  for (const ftClientConfig of ftClientConfigList) {
    ftClientConfig.nextSecret = await ftApiClientHandle.getNextSecret(
      ftClientConfig.id
    );
  }
  // #endregion

  // #region submodule repository 내용을 다음 42 client secret 으로 갱신
  for (const serviceConfig of SERVICE_CONFIGS) {
    const targetClients = serviceConfig.ftClientConfigs.filter(hasNextSecret);

    if (!targetClients.length) {
      console.log(`no need to update ${serviceConfig.githubConfig.main.repo}`);
      continue;
    }

    console.log(
      `updating submodule of ${serviceConfig.githubConfig.main.repo}`
    );

    const submoduleContentOutput = await githubHandle.getRepoContentRegularFile(
      serviceConfig.githubConfig.submodule
    );

    const newFileString = getNewEnvFileString(
      GithubHandle.contentToBuffer(submoduleContentOutput).toString(),
      targetClients
    );

    await githubHandle.updateRepoFileContent({
      ...serviceConfig.githubConfig.submodule,
      content: Buffer.from(newFileString),
      message: UPDATE_CLIENT_SECRET_MESSAGE,
      sha: submoduleContentOutput.sha,
    });
  }
  // #endregion

  // #region 갱신된 submodule commit hash 로 main repository 에 반영 및 배포
  if (APP_PROD_CONFIG.ftClientConfigs.find(hasNextSecret) !== undefined) {
    console.log(`deploying ${APP_PROD_CONFIG.githubConfig.main.repo}`);
    await deployAppProd(ftApiClientHandle, githubHandle);
  }

  if (APP_DEV_CONFIG.ftClientConfigs.find(hasNextSecret) !== undefined) {
    console.log(`deploying ${APP_DEV_CONFIG.githubConfig.main.repo}`);
    await deployAppDev(ftApiClientHandle, githubHandle);
  }

  if (LAMBDA_CONFIG.ftClientConfigs.find(hasNextSecret) !== undefined) {
    console.log(`deploying ${LAMBDA_CONFIG.githubConfig.main.repo}`);
    await deployLambda(ftApiClientHandle, githubHandle);
  }
  // #endregion
};

type FtClientConfigWithNextSecret = Required<FtClientConfig>;

const hasNextSecret = (
  ftClientConfig: FtClientConfig
): ftClientConfig is FtClientConfigWithNextSecret => {
  return ftClientConfig.nextSecret !== undefined;
};

const deployAppProd = async (
  ftClientHandle: FtApiClientHandle,
  githubHandle: GithubHandle
): Promise<void> => {
  await githubHandle.updateSubmodule({
    main: APP_PROD_CONFIG.githubConfig.main,
    submodule: APP_PROD_CONFIG.githubConfig.submodule,
    message: UPDATE_CLIENT_SECRET_MESSAGE,
  });

  // code deploy 가 prod app 으로 traffic route 하기 전 까지 대기
  // aws sdk 로는 해당 시점을 특정할 수 없다고 판단했음.
  await new Promise<void>((resolve) =>
    setTimeout(() => resolve(), 2 * 60 * 1000)
  );

  for (const ftClientConfig of APP_PROD_CONFIG.ftClientConfigs) {
    await ftClientHandle.replaceSecret(ftClientConfig.id);
  }
};

const deployAppDev = async (
  ftClientHandle: FtApiClientHandle,
  githubHandle: GithubHandle
): Promise<void> => {
  for (const ftClientConfig of APP_DEV_CONFIG.ftClientConfigs) {
    await ftClientHandle.replaceSecret(ftClientConfig.id);
  }

  await githubHandle.updateSubmodule({
    main: APP_DEV_CONFIG.githubConfig.main,
    submodule: APP_DEV_CONFIG.githubConfig.submodule,
    message: UPDATE_CLIENT_SECRET_MESSAGE,
  });
};

const deployLambda = async (
  ftClientHandle: FtApiClientHandle,
  githubHandle: GithubHandle
): Promise<void> => {
  using eventbridge = createEventbridgeHandle();
  await eventbridge.eventbridgeHandle.disableRule(LAMBDA_EVENTBRIDGE_RULE_NAME);

  for (const ftClientConfig of LAMBDA_CONFIG.ftClientConfigs) {
    await ftClientHandle.replaceSecret(ftClientConfig.id);
  }

  await githubHandle.updateSubmodule({
    main: LAMBDA_CONFIG.githubConfig.main,
    submodule: LAMBDA_CONFIG.githubConfig.submodule,
    message: UPDATE_CLIENT_SECRET_MESSAGE,
  });
};

await updateFtClientSecrets();
