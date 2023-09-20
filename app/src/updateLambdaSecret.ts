import { Config } from './libs/Config.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { VirtualBrowserProviderFactory } from './libs/VirtualBrowserProvider.js';
import { EventbridgeHandleProvider } from './reciepes/aws/EventbridgeHandle.js';
import { FtApiClientHandle } from './reciepes/ft/FtApiClientHandle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { GithubHandle } from './reciepes/github/GithubHandle.js';
import { replaceApiClientSecretString } from './reciepes/stat/replaceApiClientSecretString.js';

const ftUsername = Config.getOrThrow('FT_USERNAME');
const ftPassword = Config.getOrThrow('FT_PASSWORD');
const ftAppId = parseInt(Config.getOrThrow('LAMBDA_APP_ID'));

const githubToken = Config.getOrThrow('GITHUB_TOKEN');
const githubOwner = Config.getOrThrow('GITHUB_OWNER');
const githubDefaultBranch = Config.getOrThrow('GITHUB_DEFAULT_BRANCH');
const updateSecretCommitMessage = Config.getOrThrow(
  'UPDATE_SECRET_COMMIT_MESSAGE'
);

const lambdaRepoName = Config.getOrThrow('LAMBDA_REPO_NAME');
const labmdaRepoSubmodulePath = Config.getOrThrow('LAMBDA_REPO_SUBMODULE_PATH');

const lambdaEnvRepoName = Config.getOrThrow('LAMBDA_ENV_REPO_NAME');
const lambdaEnvFilePath = Config.getOrThrow('LAMBDA_ENV_FILE_PATH');

const lambdaRepo = {
  repo: lambdaRepoName,
  owner: githubOwner,
  branch: githubDefaultBranch,
};

const lambdaEnvRepo = {
  repo: lambdaEnvRepoName,
  owner: githubOwner,
  branch: githubDefaultBranch,
};

const awsRegion = Config.getOrThrow('AWS_REGION');
const eventbridgeRulename = Config.getOrThrow('LAMBDA_EVENTBRIDGE_RULENAME');

const main = async (): Promise<void> => {
  const virtualBrowserProvider =
    await VirtualBrowserProviderFactory.createInstance();

  await virtualBrowserProvider.start(async (browser) => {
    const ftApiClientHandle = await FtApiClientHandle.createInstance({
      browser,
      loginHandle: new LoginHandle(new FtLoginStrategy(ftUsername, ftPassword)),
      appId: ftAppId,
    });

    const nextSecret = await ftApiClientHandle.getNextSecret();
    if (!nextSecret) {
      return;
    }

    const githubHandle = new GithubHandle(githubToken);

    await updateLambdaEnvRepoApiSecret({ githubHandle, nextSecret });
    await updateLambdaRepoApiSecretSubmodule({
      ftApiClientHandle,
      githubHandle,
    });
  });
};

const updateLambdaEnvRepoApiSecret = async ({
  nextSecret,
  githubHandle,
}: {
  nextSecret: string;
  githubHandle: GithubHandle;
}): Promise<void> => {
  const contentData = await githubHandle.getRepoFileContentData({
    ...lambdaEnvRepo,
    path: lambdaEnvFilePath,
  });

  const newContent = Buffer.from(
    replaceApiClientSecretString(
      GithubHandle.contentToBuffer(contentData).toString(),
      nextSecret
    )
  );

  await githubHandle.updateRepoFileContent({
    ...lambdaEnvRepo,
    path: lambdaEnvFilePath,
    content: newContent,
    message: updateSecretCommitMessage,
    sha: contentData.sha,
  });
};

const updateLambdaRepoApiSecretSubmodule = async ({
  ftApiClientHandle,
  githubHandle,
}: {
  ftApiClientHandle: FtApiClientHandle;
  githubHandle: GithubHandle;
}): Promise<void> => {
  await disableLambdaTrigger();

  await ftApiClientHandle.replaceSecret();

  await githubHandle.updateSubmodule({
    main: {
      ...lambdaRepo,
      submodulePath: labmdaRepoSubmodulePath,
    },
    submodule: lambdaEnvRepo,
    message: updateSecretCommitMessage,
  });

  // submodule 이 commit 을 main branch 에 만들고, 이것이 lambda 의 deploy github action
  // 을 발생시키게 되어 배포가 완료됨.
};

const disableLambdaTrigger = async (): Promise<void> => {
  const eventbridgeHandleProvider = new EventbridgeHandleProvider(awsRegion);
  await eventbridgeHandleProvider.start(async (eventbridgeHandle) => {
    await eventbridgeHandle.disableRule(eventbridgeRulename);
  });
};

await main();
