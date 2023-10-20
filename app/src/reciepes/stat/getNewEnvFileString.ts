import type { FtClientConfig } from '../../configs/ftClient/types.js';

const INDEX_NOT_FOUND = -1;

export const getNewEnvFileString = (
  prevFileString: string,
  {
    nextSecret,
    envKey,
  }: Pick<Required<FtClientConfig>, 'envKey' | 'nextSecret'>
): string => {
  const envRows = prevFileString.split('\n');

  const prevIndex = envRows.findIndex(
    (envRow) => envRow.split('=')[0] === envKey
  );

  const newSecretString = [envKey, nextSecret].join('=');

  if (prevIndex !== INDEX_NOT_FOUND) {
    envRows[prevIndex] = newSecretString;
  } else {
    envRows.push(newSecretString);
  }

  return envRows.join('\n');
};
