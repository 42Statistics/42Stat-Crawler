import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';
import type { FtClientConfig } from './types.js';

export const APP_PROD_CONFIG: FtClientConfig = {
  id: 14518,
  awsSecretId: getOrThrowEnv('sAWS_PROD_FT_CLIENT_SECRET_ID'),
};
