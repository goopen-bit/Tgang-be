import { DbCollections } from "src/config/types";
import { Db } from "mongodb";

module.exports = {
  async up(db: Db, client) {
    await db.collection(DbCollections.UPGRADES).createIndex(
      {
        id: 1,
      },
      {
        name: "id_unique_index",
        unique: true,
      }
    );
  },

  async down(db: Db, client) {
    await db.collection(DbCollections.UPGRADES).dropIndex("id_unique_index");
  },
};
