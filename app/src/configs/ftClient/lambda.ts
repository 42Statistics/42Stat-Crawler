import { GITHUB_OWNER } from '../github/github.js';
import type { ServiceConfig } from './types.js';

export const LAMBDA_CONFIG: ServiceConfig = {
  ftClientConfig: {
    id: 13674,
  },
  deployConfig: {
    type: 'submodule',
    main: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Lambda',
      branch: 'main',
      path: 'env',
    },
    submodule: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Lambda-env',
      path: '.env',
      branch: 'main',
    },
  },
};

export const LAMBDA_EVENTBRIDGE_RULE_NAME = 'stat-lambda-rule';
