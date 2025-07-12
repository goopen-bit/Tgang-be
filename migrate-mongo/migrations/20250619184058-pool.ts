import { Db } from 'mongodb';
import { DbCollections } from '../../src/config/types';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.POOLS).createIndex(
      {
        id: 1,
      },
      {
        name: 'id_unique_index',
        unique: true,
      },
    );
  },

  async down(db: Db) {
    await db.collection(DbCollections.POOLS).dropIndex('id_unique_index');
  },
};
