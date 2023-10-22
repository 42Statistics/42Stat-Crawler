import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { FtClientConfig } from './types.js';

export const APP_LOCAL_CONFIG: FtClientConfig = {
  id: 16594,
  awsSecretId: getOrThrowEnv('AWS_LOCAL_FT_CLIENT_SECRET_ID'),
};
