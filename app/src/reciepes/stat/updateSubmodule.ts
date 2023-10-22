import { SubmoduleDeployable } from '../../configs/ftClient/serviceConfig.js';
import { UPDATE_CLIENT_SECRET_MESSAGE } from '../../configs/github/github.js';
import { GithubHandle } from '../github/GithubHandle.js';
import { getNewEnvFileString } from './getNewEnvFileString.js';

export const updateSubmodule = async ({
  githubHandle,
  deployConfig,
  nextSecret,
}: {
  githubHandle: GithubHandle;
  deployConfig: SubmoduleDeployable;
  nextSecret: string;
}): Promise<void> => {
  const submoduleContentOutput = await githubHandle.getRepoContentRegularFile(
    deployConfig.submodule
  );

  const newFileString = getNewEnvFileString({
    prevFileString: GithubHandle.contentToBuffer(
      submoduleContentOutput
    ).toString(),
    nextSecret,
    envKey: deployConfig.envKey,
  });

  await githubHandle.updateRepoFileContent({
    ...deployConfig.submodule,
    content: Buffer.from(newFileString),
    message: UPDATE_CLIENT_SECRET_MESSAGE,
    sha: submoduleContentOutput.sha,
  });
};
