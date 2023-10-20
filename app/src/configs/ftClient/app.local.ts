import { GITHUB_OWNER } from '../github/github.js';
import type { ServiceFtClientConfig } from './types.js';

export const APP_LOCAL_CONFIG: ServiceFtClientConfig = {
  ftClientConfig: {
    id: 16594,
    envKey: 'LOCAL_CLIENT_SECRET',
  },
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
      path: '.env.local',
      branch: 'dev',
      ref: 'dev',
    },
  },
};
