import { mongoUrl } from '../../src/config/env';
import * as MigrateMongoConfig from '../../migrate-mongo/migrations';
import * as SeedMongoConfig from '../../migrate-mongo/seeders';
import { cleanUpMongo, runMigrations } from '../utils/mongo';

export function isLocalhost() {
  const url = new URL(mongoUrl);
  if (
    (!url.hostname.includes('localhost') &&
      !url.hostname.includes('127.0.0.1') &&
      !url.hostname.includes('mongo')) ||
    url.hostname.includes('mongodb')
  ) {
    console.error('Tests must be run on local db');
    process.exit(1);
  }
}

const setup = async () => {
  isLocalhost();
  await cleanUpMongo();
  await runMigrations(MigrateMongoConfig);
  await runMigrations(SeedMongoConfig)
};

export default setup;
