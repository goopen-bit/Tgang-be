import { Db } from 'mongodb';
import { DbCollections } from '../../src/config/types';
import { EProduct } from "../../src/market/market.const";

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.POOLS).insertMany([
      {
        id: 'USD-HERB',
        cash: {
          name: 'USD',
          reserve: 1000000,
        },
        product: {
          name: EProduct.HERB,
          reserve: 50000,
        },
        feePercent: 0,
      },
      {
        id: 'USD-POWDER',
        cash: {
          name: 'USD',
          reserve: 10000000,
        },
        product: {
          name: EProduct.POWDER,
          reserve: 100000,
        },
        feePercent: 0,
      },
    ]);
  },

  async down(db: Db) {
    await db.collection(DbCollections.POOLS).deleteMany({});
  },
};
