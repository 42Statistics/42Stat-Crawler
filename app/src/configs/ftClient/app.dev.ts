import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { ServiceConfig } from './serviceConfig.js';

export const APP_DEV_CONFIG: ServiceConfig<'awsSecretsManager'> = {
  ftClientConfig: {
    id: 16593,
  },
  deployConfig: {
    type: 'awsSecretsManager',
    secretId: getOrThrowEnv('AWS_DEV_FT_CLIENT_SECRET_ID'),
    secretKey: getOrThrowEnv('CLIENT_SECRET_KEY'),
  },
};
