import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { ServiceConfig } from './serviceConfig.js';

export const APP_PROD_CONFIG: ServiceConfig<'awsSecretsManager'> = {
  ftClientConfig: {
    id: 14518,
  },
  deployConfig: {
    type: 'awsSecretsManager',
    secretId: getOrThrowEnv('AWS_PROD_FT_CLIENT_SECRET_ID'),
    secretKey: getOrThrowEnv('CLIENT_SECRET_KEY'),
  },
};
