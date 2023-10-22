import { MongoClient } from 'mongodb';

export const createMongoClient = async (
  url: string
): Promise<
  {
    mongoHandle: Omit<MongoClient, 'connect' | 'close'>;
  } & AsyncDisposable
> => {
  const mongoClient = new MongoClient(url);

  await mongoClient.connect();

  return {
    mongoHandle: mongoClient,
    [Symbol.asyncDispose]: async () => await mongoClient.close(),
  };
};
