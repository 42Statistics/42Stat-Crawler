const API_CLIENT_SECRET_KEY = 'API_CLIENT_SECRET';
const INDEX_NOT_FOUND = -1;

export const replaceApiClientSecret = (
  envContent: string,
  newSecret: string
): string => {
  const envRows = envContent.split('\n');
  const prevIndex = envRows.findIndex(
    (envRow) => envRow.split('=')[0] === API_CLIENT_SECRET_KEY
  );

  const newSecretString = [API_CLIENT_SECRET_KEY, newSecret].join('=');

  if (prevIndex !== INDEX_NOT_FOUND) {
    envRows[prevIndex] = newSecretString;
  } else {
    envRows.push(newSecretString);
  }

  return envRows.join('\n');
};
