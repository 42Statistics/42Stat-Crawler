import { GITHUB_OWNER } from '../github/github.js';
import type { ServiceFtClientConfig } from './types.js';

export const LAMBDA_CONFIG: ServiceFtClientConfig = {
  ftClientConfig: {
    id: 13674,
    envKey: 'API_CLIENT_SECRET',
  },
  githubConfig: {
    main: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Lambda',
      branch: 'main',
      ref: 'main',
      path: 'env',
    },
    submodule: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Lambda-env',
      path: '.env',
      branch: 'main',
      ref: 'main',
    },
  },
};

export const LAMBDA_EVENTBRIDGE_RULE_NAME = 'stat-lambda-rule';
