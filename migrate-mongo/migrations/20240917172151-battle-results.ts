import { Db } from 'mongodb';
import { DbCollections } from '../../src/config/types';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.BATTLE_RESULTS).createIndex(
      {
        'attackerId': 1,
      },
      {
        name: 'attackerId',
      },
    );
    await db.collection(DbCollections.BATTLE_RESULTS).createIndex(
      {
        'defenderId': 1,
      },
      {
        name: 'defenderId',
      },
    );

    await db.collection(DbCollections.BATTLE_RESULTS).createIndex(
      {
        'createdAt': 1,
      },
      {
        name: 'createdAt_ttl',
        expireAfterSeconds: 60 * 60 * 24 * 7, // 7 days
      },
    );
  },

  async down(db: Db) {
    await db.collection(DbCollections.BATTLE_RESULTS).dropIndex('attackerId');
    await db.collection(DbCollections.BATTLE_RESULTS).dropIndex('defenderId');
    await db.collection(DbCollections.BATTLE_RESULTS).dropIndex('createdAt_ttl');
  },
};
