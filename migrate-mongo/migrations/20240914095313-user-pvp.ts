import { Db } from 'mongodb';
import { DbCollections } from '../../src/config/types';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.USERS).createIndex(
      {
        reputation: 1,
        'pvp.lastDefendDate': 1,
      },
      {
        name: 'reputation_last_defend_date_index',
      },
    );
  },

  async down(db: Db) {
    await db.collection(DbCollections.USERS).dropIndex('reputation_last_defend_date_index');
  },
};
