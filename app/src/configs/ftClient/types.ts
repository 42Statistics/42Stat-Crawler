import type {
  GithubBranchInfo,
  GithubRepoContentInfo,
} from '../../reciepes/github/GithubhandleDto.js';

export type FtClientConfig = {
  readonly id: number;
  readonly envKey: string;
  nextSecret?: string;
};

export type FtClientGithubRepoConfig = {
  main: GithubBranchInfo & GithubRepoContentInfo;
  submodule: GithubBranchInfo & GithubRepoContentInfo;
};

export type ServiceFtClientConfig = {
  readonly ftClientConfigs: FtClientConfig[];
  readonly githubConfig: FtClientGithubRepoConfig;
};
