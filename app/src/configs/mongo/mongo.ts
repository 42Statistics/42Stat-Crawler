import { getOrThrowEnv } from '../../libs/getOrThrowEnv.js';

export type DocumentWithId = {
  id: number;
};

export const MONGO_CONFIG = {
  mongodbUrl: getOrThrowEnv('MONGODB_URL'),
  projectsCollection: 'projects',
  pdfUrlField: 'pdfUrl',
};
