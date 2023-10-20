const INDEX_NOT_FOUND = -1;

export const getNewEnvFileString = (
  prevFileString: string,
  ftClientConfigs: {
    nextSecret: string;
    envKey: string;
  }[]
): string => {
  const envRows = prevFileString.split('\n');

  ftClientConfigs.forEach(({ nextSecret, envKey }) => {
    const prevIndex = envRows.findIndex(
      (envRow) => envRow.split('=')[0] === envKey
    );

    const newSecretString = [envKey, nextSecret].join('=');

    if (prevIndex !== INDEX_NOT_FOUND) {
      envRows[prevIndex] = newSecretString;
    } else {
      envRows.push(newSecretString);
    }
  });

  return envRows.join('\n');
};
