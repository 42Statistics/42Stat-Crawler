import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';

export const PROD_MONGODB_URL = getOrThrowEnv('PROD_MONGODB_URL');
