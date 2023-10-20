import { GITHUB_OWNER } from '../github/github.js';
import type { ServiceFtClientConfig } from './types.js';

export const APP_DEV_CONFIG: ServiceFtClientConfig = {
  ftClientConfigs: [
    {
      id: 16593,
      envKey: 'DEV_CLIENT_SECRET',
    },
    {
      id: 16594,
      envKey: 'LOCAL_CLIENT_SECRET',
    },
  ],
  githubConfig: {
    main: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Backend',
      branch: 'dev',
      ref: 'dev',
      path: 'env',
    },
    submodule: {
      owner: GITHUB_OWNER,
      repo: '42Stat-Backend-env',
      path: '.env.dev',
      branch: 'dev',
      ref: 'dev',
    },
  },
};
