import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';

export const DEV_MONGODB_URL = getOrThrowEnv('DEV_MONGODB_URL');
