import type {
  GithubBranchInfo,
  GithubRepoContentInfo,
} from '../../reciepes/github/GithubhandleDto.js';

export type FtClientConfig = {
  readonly id: number;
  nextSecret?: string;
};

export type SubmoduleDeployable = {
  type: 'submodule';
  main: GithubBranchInfo & GithubRepoContentInfo;
  submodule: GithubBranchInfo & GithubRepoContentInfo;
};

export type AwsSecretsManagerDeployable = {
  type: 'awsSecretsManager';
  secretId: string;
};

export type ServiceConfig = {
  readonly ftClientConfig: FtClientConfig;
  readonly deployConfig: SubmoduleDeployable | AwsSecretsManagerDeployable;
};
