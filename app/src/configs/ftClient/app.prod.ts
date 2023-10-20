import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { ServiceConfig } from './types.js';

export const APP_PROD_CONFIG: ServiceConfig = {
  ftClientConfig: {
    id: 14518,
  },
  deployConfig: {
    type: 'awsSecretsManager',
    secretId: getOrThrowEnv('AWS_PROD_FT_CLIENT_SECRET_ID'),
  },
};
