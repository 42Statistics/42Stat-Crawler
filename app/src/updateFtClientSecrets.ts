import { APP_DEV_CONFIG } from './configs/ftClient/app.dev.js';
import { APP_LOCAL_CONFIG } from './configs/ftClient/app.local.js';
import {
  APP_PROD_CONFIG,
  APP_PROD_WORKFLOW_ID,
} from './configs/ftClient/app.prod.js';
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
  const SERVICE_CONFIGS = [
    APP_PROD_CONFIG,
    APP_DEV_CONFIG,
    APP_LOCAL_CONFIG,
    LAMBDA_CONFIG,
  ];

  await using browser = await BrowserFactory.createInstance();

  const ftApiClientHandle = await FtApiClientHandle.createInstance({
    browser: browser.browserHandle,
    loginHandle: new LoginHandle(new FtLoginStrategy(FT_USERNAME, FT_PASSWORD)),
  });

  const githubHandle = new GithubHandle(GITHUB_TOKEN);

  // #region 다음 42 client secret fetch
  for (const { ftClientConfig } of SERVICE_CONFIGS) {
    ftClientConfig.nextSecret = await ftApiClientHandle.getNextSecret(
      ftClientConfig.id
    );
  }
  // #endregion

  // #region submodule repository 내용을 다음 42 client secret 으로 갱신
  for (const serviceConfig of SERVICE_CONFIGS) {
    if (!hasNextSecret(serviceConfig.ftClientConfig)) {
      console.log(
        `no need to update ${serviceConfig.githubConfig.main.repo}/${serviceConfig.githubConfig.submodule.path}`
      );

      continue;
    }

    console.log(
      `updating submodule of ${serviceConfig.githubConfig.main.repo}/${serviceConfig.githubConfig.submodule.path}`
    );

    const submoduleContentOutput = await githubHandle.getRepoContentRegularFile(
      serviceConfig.githubConfig.submodule
    );

    const newFileString = getNewEnvFileString(
      GithubHandle.contentToBuffer(submoduleContentOutput).toString(),
      serviceConfig.ftClientConfig
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
  if (hasNextSecret(APP_PROD_CONFIG.ftClientConfig)) {
    console.log(
      `deploying ${APP_PROD_CONFIG.githubConfig.main.repo}/${APP_PROD_CONFIG.githubConfig.main.branch}`
    );

    await deployAppProd(ftApiClientHandle, githubHandle);
  }

  if (
    hasNextSecret(APP_DEV_CONFIG.ftClientConfig) ||
    hasNextSecret(APP_LOCAL_CONFIG.ftClientConfig)
  ) {
    console.log(
      `deploying ${APP_DEV_CONFIG.githubConfig.main.repo}/${APP_DEV_CONFIG.githubConfig.main.branch}`
    );

    await deployAppDev(ftApiClientHandle, githubHandle);
  }

  if (hasNextSecret(LAMBDA_CONFIG.ftClientConfig)) {
    console.log(
      `deploying ${LAMBDA_CONFIG.githubConfig.main.repo}/${LAMBDA_CONFIG.githubConfig.main.branch}`
    );

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

  await githubHandle.createWorkflowDispathEvent({
    owner: APP_PROD_CONFIG.githubConfig.main.owner,
    repo: APP_PROD_CONFIG.githubConfig.main.repo,
    ref: APP_PROD_CONFIG.githubConfig.main.ref,
    workflow_id: APP_PROD_WORKFLOW_ID,
  });

  // code deploy 가 prod app 으로 traffic route 하기 전 까지 대기
  // aws sdk 로는 해당 시점을 특정할 수 없다고 판단했음.
  console.log('waiting for code deploy...');

  await new Promise<void>((resolve) =>
    setTimeout(() => resolve(), 7 * 60 * 1000)
  );

  await ftClientHandle.replaceSecret(APP_PROD_CONFIG.ftClientConfig.id);
};

const deployAppDev = async (
  ftClientHandle: FtApiClientHandle,
  githubHandle: GithubHandle
): Promise<void> => {
  if (hasNextSecret(APP_DEV_CONFIG.ftClientConfig)) {
    await ftClientHandle.replaceSecret(APP_DEV_CONFIG.ftClientConfig.id);
  }

  if (hasNextSecret(APP_LOCAL_CONFIG.ftClientConfig)) {
    await ftClientHandle.replaceSecret(APP_LOCAL_CONFIG.ftClientConfig.id);
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

  await ftClientHandle.replaceSecret(LAMBDA_CONFIG.ftClientConfig.id);

  await githubHandle.updateSubmodule({
    main: LAMBDA_CONFIG.githubConfig.main,
    submodule: LAMBDA_CONFIG.githubConfig.submodule,
    message: UPDATE_CLIENT_SECRET_MESSAGE,
  });
};

await updateFtClientSecrets();
