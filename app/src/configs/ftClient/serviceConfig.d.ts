import type {
  GithubBranchInfo,
  GithubRepoContentInfo,
} from '../../reciepes/github/GithubhandleDto.ts';

export type FtClientConfig = {
  readonly id: number;
};

export type SubmoduleDeployable = {
  type: 'submodule';
  envKey: string;
  main: GithubBranchInfo & GithubRepoContentInfo;
  submodule: GithubBranchInfo & GithubRepoContentInfo;
};

export type AwsSecretsManagerDeployable = {
  type: 'awsSecretsManager';
  secretId: string;
  secretKey: string;
};

export type DeployableType = 'submodule' | 'awsSecretsManager';

export type ServiceConfig<T extends DeployableType> = {
  readonly ftClientConfig: FtClientConfig;
  readonly deployConfig: T extends 'submodule'
    ? SubmoduleDeployable
    : AwsSecretsManagerDeployable;
};
