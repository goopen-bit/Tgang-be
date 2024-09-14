import { DbCollections } from 'src/config/types';
import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.USERS).createIndex(
      {
        'pvp.pvpEnabled': 1,
        'pvp.lastDefendDate': 1,
      },
      {
        name: 'pvp_enabled_last_defend_date_index',
      },
    );
  },

  async down(db: Db) {
    await db.collection(DbCollections.USERS).dropIndex('pvp_enabled_last_defend_date_index');
  },
};
