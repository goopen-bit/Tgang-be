import { DbCollections } from 'src/config/types';
import { Db } from 'mongodb';
import { EProduct } from 'src/product/product.const';

module.exports = {
  async up(db: Db) {
    await db.collection(DbCollections.MARKETS).insertOne({
      id: 'NY',
      name: 'New York',
      products: [
        {
          name: EProduct.WEED,
          price: 20,
        },
        {
          name: EProduct.COCAINE,
          price: 100,
        },
        {
          name: EProduct.HEROIN,
          price: 50,
        },
        {
          name: EProduct.LSD,
          price: 10,
        },
        {
          name: EProduct.MDMA,
          price: 30,
        },
        {
          name: EProduct.MUSHROOMS,
          price: 15,
        },
        {
          name: EProduct.METHAMPHETAMINE,
          price: 40,
        },
        {
          name: EProduct.KETAMINE,
          price: 35,
        },
        {
          name: EProduct.HASHISH,
          price: 25,
        },
        {
          name: EProduct.PCP,
          price: 45,
        },
        {
          name: EProduct.DMT,
          price: 55,
        },
      ],
    });
  },

  async down(db: Db) {
    await db.collection(DbCollections.MARKETS).deleteOne({ id: 'NY' });
  }
};
