import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { ServiceConfig } from './serviceConfig.js';

export const LAMBDA_CONFIG: ServiceConfig<'awsSecretsManager'> = {
  ftClientConfig: {
    id: 13674,
  },
  deployConfig: {
    type: 'awsSecretsManager',
    secretId: getOrThrowEnv('AWS_LAMBDA_FT_CLIENT_SECRET_ID'),
    secretKey: getOrThrowEnv('CLIENT_SECRET_KEY'),
  },
};

export const LAMBDA_EVENTBRIDGE_RULE_NAME = 'stat-lambda-rule';
