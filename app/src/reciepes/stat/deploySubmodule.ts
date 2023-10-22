import { ServiceConfig } from '../../configs/ftClient/serviceConfig.js';
import { UPDATE_CLIENT_SECRET_MESSAGE } from '../../configs/github/github.js';
import { GithubHandle } from '../github/GithubHandle.js';

export const deploySubmodule = async (
  githubHandle: GithubHandle,
  serviceConfig: ServiceConfig<'submodule'>
): Promise<void> => {
  await githubHandle.updateSubmodule({
    main: serviceConfig.deployConfig.main,
    submodule: serviceConfig.deployConfig.submodule,
    message: UPDATE_CLIENT_SECRET_MESSAGE,
  });
};
