import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { ServiceConfig } from './types.js';

export const APP_DEV_CONFIG: ServiceConfig = {
  ftClientConfig: {
    id: 16593,
  },
  deployConfig: {
    type: 'awsSecretsManager',
    secretId: getOrThrowEnv('AWS_DEV_FT_CLIENT_SECRET_ID'),
  },
};
