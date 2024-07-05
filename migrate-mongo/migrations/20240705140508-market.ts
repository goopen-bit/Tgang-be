import { DbCollections } from 'src/config/types';
import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.MARKETS).createIndex(
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
    await db.collection(DbCollections.MARKETS).dropIndex('id_unique_index');
  }
};
