require('tsconfig-paths/register');
import * as env from '../src/config/env';

const config = {
  mongodb: {
    url: env.mongoUrl,
    databaseName: env.mongoDb,
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: './migrate-mongo/seeders',

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'MongoData',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.ts',

  // The module system to use. Either 'commonjs' or 'esm'.
  moduleSystem: 'commonjs',
};

// Return the config as a promise
module.exports = config;
