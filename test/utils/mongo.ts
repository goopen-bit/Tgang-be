import { config, database, up } from 'migrate-mongo';
import { MongoClient } from 'mongodb';
import { mongoUrl, mongoDb } from 'src/config/env';

/**
 * Run migrations
 */
export async function runMigrations(migrationConfig): Promise<void> {
  config.set(migrationConfig);
  const { db, client } = await database.connect();
  await up(db, client);
  await client.close();
}

/**
 * Cleans up database
 */
export async function cleanUpMongo(): Promise<void> {
  const client = await MongoClient.connect(mongoUrl);
  const db = client.db(mongoDb);

  const collections = await db.listCollections({}).toArray();
  await Promise.all(
    collections
      .filter((collection) => collection.name !== 'system.indexes')
      .map((collection) => db.collection(collection.name).deleteMany({})),
  );

  await client.close();
}
