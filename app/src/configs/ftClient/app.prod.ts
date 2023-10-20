import { GITHUB_OWNER } from '../github/github.js';
import type { ServiceFtClientConfig } from './types.js';

export const APP_PROD_CONFIG: ServiceFtClientConfig = {
  ftClientConfigs: [
    {
      id: 14518,
      envKey: 'PROD_CLIENT_SECRET',
    },
  ],
  githubConfig: {
    main: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Backend',
      branch: 'main',
      ref: 'main',
      path: 'env',
    },
    submodule: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Backend-env',
      path: '.env.prod',
      branch: 'main',
      ref: 'main',
    },
  },
};
