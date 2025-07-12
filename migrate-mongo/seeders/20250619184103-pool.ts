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
        id: 'USD-MUSHROOM',
        cash: {
          name: 'USD',
          reserve: 1250000,
        },
        product: {
          name: EProduct.MUSHROOM,
          reserve: 50000,
        },
        feePercent: 0,
      },
      {
        id: 'USD-ACID',
        cash: {
          name: 'USD',
          reserve: 1500000,
        },
        product: {
          name: EProduct.ACID,
          reserve: 50000,
        },
        feePercent: 0,
      },
      {
        id: 'USD-PILL',
        cash: {
          name: 'USD',
          reserve: 2000000,
        },
        product: {
          name: EProduct.PILL,
          reserve: 50000,
        },
        feePercent: 0,
      },
      {
        id: 'USD-CRYSTAL',
        cash: {
          name: 'USD',
          reserve: 3000000,
        },
        product: {
          name: EProduct.CRYSTAL,
          reserve: 50000,
        },
        feePercent: 0,
      },
      {
        id: 'USD-POWDER',
        cash: {
          name: 'USD',
          reserve: 5000000,
        },
        product: {
          name: EProduct.POWDER,
          reserve: 50000,
        },
        feePercent: 0,
      },
    ]);
  },

  async down(db: Db) {
    await db.collection(DbCollections.POOLS).deleteMany({});
  },
};
