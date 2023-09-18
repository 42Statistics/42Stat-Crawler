import { Config } from './libs/Config.js';
import { LoginHandle } from './libs/LoginHandle.js';
import { VirtualBrowserProviderFactory } from './libs/VirtualBrowserProvider.js';
import { EventbridgeHandleProvider } from './reciepes/aws/EventbridgeHandle.js';
import { FtApiClientHandle } from './reciepes/ft/FtApiClientHandle.js';
import { FtLoginStrategy } from './reciepes/ft/FtLoginStrategy.js';
import { GithubHandle } from './reciepes/github/GithubHandle.js';
import { GithubRepoContentInfo } from './reciepes/github/GithubhandleDto.js';
import { replaceApiClientSecret } from './reciepes/stat/replaceApiClientSecret.js';

const main = async (): Promise<void> => {
  const virtualBrowserProvider =
    await VirtualBrowserProviderFactory.createInstance();

  virtualBrowserProvider.start(async (browser) => {
    const username = Config.getOrThrow('FT_USERNAME');
    const password = Config.getOrThrow('FT_PASSWORD');
    const appId = parseInt(Config.getOrThrow('LAMBDA_APP_ID'));

    const ftApiClientHandle = await FtApiClientHandle.createInstance({
      browser,
      loginHandle: new LoginHandle(new FtLoginStrategy(username, password)),
      appId,
    });

    const nextSecret = await ftApiClientHandle.getNextSecret();
    if (!nextSecret) {
      return;
    }

    await updateGithubEnv(nextSecret);
    await deployToAws(ftApiClientHandle);
  });
};

const updateGithubEnv = async (nextSecret: string): Promise<void> => {
  const githubOwner = Config.getOrThrow('GITHUB_OWNER');
  const githubToken = Config.getOrThrow('GITHUB_TOKEN');
  const updateSecretCommitMessage = Config.getOrThrow(
    'UPDATE_SECRET_COMMIT_MESSAGE'
  );

  const lambdaEnvRepoName = Config.getOrThrow('LAMBDA_ENV_REPO_NAME');
  const lambdaEnvPath = Config.getOrThrow('LAMBDA_ENV_PATH');

  const githubHandle = new GithubHandle(githubToken);

  const lambdaEnvRepoContentInfo: GithubRepoContentInfo = {
    owner: githubOwner,
    repo: lambdaEnvRepoName,
    path: lambdaEnvPath,
  };

  const contentData = await githubHandle.getRepoContentData(
    lambdaEnvRepoContentInfo
  );

  const newContent = Buffer.from(
    replaceApiClientSecret(
      GithubHandle.contentToBuffer(contentData).toString(),
      nextSecret
    )
  );

  await githubHandle.updateRepoContent({
    ...lambdaEnvRepoContentInfo,
    content: newContent,
    message: updateSecretCommitMessage,
    sha: contentData.sha,
  });

  // todo: github lambda submodule update, commit
};

const deployToAws = async (
  ftApiClientHandle: FtApiClientHandle
): Promise<void> => {
  // todo: aws credential 설정
  const awsRegion = Config.getOrThrow('AWS_REGION');
  const eventbridgeRulename = Config.getOrThrow('LAMBDA_EVENTBRIDGE_RULENAME');

  const eventbridgeHandleProvider = new EventbridgeHandleProvider(awsRegion);
  await eventbridgeHandleProvider.start(async (eventbridgeHandle) => {
    await eventbridgeHandle.disableRule(eventbridgeRulename);

    // todo: lambda deploy

    await ftApiClientHandle.replaceSecret();

    await eventbridgeHandle.enableRule(eventbridgeRulename);
  });
};

await main();

// todo: pdf
// const response = await fetch(
//   'https://cdn.intra.42.fr/pdf/pdf/81270/en.subject.pdf'
// );

// const content = await response.arrayBuffer();

// await fs.writeFile('./test.pdf', Buffer.from(content));
