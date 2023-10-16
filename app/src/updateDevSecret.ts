import { Config } from './libs/Config.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { VirtualBrowserProviderFactory } from './libs/VirtualBrowserProvider.js';
import { FtApiClientHandle } from './reciepes/ft/FtApiClientHandle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { GithubHandle } from './reciepes/github/GithubHandle.js';
import { replaceApiClientSecretString } from './reciepes/stat/replaceApiClientSecretString.js';

const ftUsername = Config.getOrThrow('FT_USERNAME');
const ftPassword = Config.getOrThrow('FT_PASSWORD');
const ftAppId = parseInt(Config.getOrThrow('DEV_APP_ID'));

const githubToken = Config.getOrThrow('GITHUB_TOKEN');
const githubOwner = Config.getOrThrow('GITHUB_OWNER');
const githubDefaultBranch = Config.getOrThrow('GITHUB_DEFAULT_BRANCH');
const updateSecretCommitMessage = Config.getOrThrow(
  'UPDATE_SECRET_COMMIT_MESSAGE'
);

const devRepoName = Config.getOrThrow('REPO_NAME');
const devRepoSubmodulePath = Config.getOrThrow('REPO_SUBMODULE_PATH');

const devEnvRepoName = Config.getOrThrow('ENV_REPO_NAME');
const devEnvFilePath = Config.getOrThrow('ENV_FILE_PATH');

const devRepo = {
  repo: devRepoName,
  owner: githubOwner,
  branch: githubDefaultBranch,
};

const devEnvRepo = {
  repo: devEnvRepoName,
  owner: githubOwner,
  branch: githubDefaultBranch,
};

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

    await updateDevEnvRepoApiSecret({ githubHandle, nextSecret });
    await updateDevRepoApiSecretSubmodule({
      ftApiClientHandle,
      githubHandle,
    });
  });
};

const updateDevEnvRepoApiSecret = async ({
  nextSecret,
  githubHandle,
}: {
  nextSecret: string;
  githubHandle: GithubHandle;
}): Promise<void> => {
  const contentData = await githubHandle.getRepoFileContentData({
    ...devEnvRepo,
    path: devEnvFilePath,
  });

  const newContent = Buffer.from(
    replaceApiClientSecretString(
      GithubHandle.contentToBuffer(contentData).toString(),
      nextSecret
    )
  );

  await githubHandle.updateRepoFileContent({
    ...devEnvRepo,
    path: devEnvFilePath,
    content: newContent,
    message: updateSecretCommitMessage,
    sha: contentData.sha,
  });
};

const updateDevRepoApiSecretSubmodule = async ({
  ftApiClientHandle,
  githubHandle,
}: {
  ftApiClientHandle: FtApiClientHandle;
  githubHandle: GithubHandle;
}): Promise<void> => {
  //todo: 여기에 disableLambdaTrigger 가 사라진걸 제외하고는 기존 코드와 동일
  //깃헙액션에 main push 도 배포하도록 설정

  await ftApiClientHandle.replaceSecret();

  await githubHandle.updateSubmodule({
    main: {
      ...devRepo,
      submodulePath: devRepoSubmodulePath,
    },
    submodule: devEnvRepo,
    message: updateSecretCommitMessage,
  });
};

await main();
