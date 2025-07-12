import { Db } from 'mongodb';
import { DbCollections, EProduct } from '../../src/config/types';

// All monetary values are stored in cents to avoid floating point precision issues
module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.POOLS).insertMany([
      {
        id: 'USD-HERB',
        cash: {
          name: 'USD',
          reserve: 100000000, // $1,000,000.00 in cents
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
          reserve: 125000000, // $1,250,000.00 in cents
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
          reserve: 150000000, // $1,500,000.00 in cents
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
          reserve: 200000000, // $2,000,000.00 in cents
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
          reserve: 300000000, // $3,000,000.00 in cents
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
          reserve: 500000000, // $5,000,000.00 in cents
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
