import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';

export const GITHUB_OWNER = '42Statistics';
export const GITHUB_TOKEN = getOrThrowEnv('CRAWLER_GITHUB_AUTH');
export const UPDATE_CLIENT_SECRET_MESSAGE =
  'chore: :closed_lock_with_key: 42 client secret 갱신';
