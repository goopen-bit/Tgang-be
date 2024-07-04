import { DbCollections } from 'src/config/types';
import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.USERS).createIndex(
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
    await db.collection(DbCollections.USERS).dropIndex('id_unique_index');
  }
};
