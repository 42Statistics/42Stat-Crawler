import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { ServiceConfig } from './types.js';

export const APP_LOCAL_CONFIG: ServiceConfig = {
  ftClientConfig: {
    id: 16594,
  },
  deployConfig: {
    type: 'awsSecretsManager',
    secretId: getOrThrowEnv('AWS_LOCAL_FT_CLIENT_SECRET_ID'),
  },
};
