import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { FtClientConfig } from './types.js';

export const APP_DEV_CONFIG: FtClientConfig = {
  id: 16593,
  awsSecretId: getOrThrowEnv('AWS_DEV_FT_CLIENT_SECRET_ID'),
};
