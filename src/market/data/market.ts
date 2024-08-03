import { EProduct } from "../market.const";
import { Market } from "../market.interface";

export const markets: Market[] = [
  {
    id: "NY",
    name: "New York",
    products: [
      {
        name: EProduct.WEED,
        price: 20,
      },
      {
        name: EProduct.MUSHROOM,
        price: 25,
      },
      {
        name: EProduct.LSD,
        price: 30,
      },
      {
        name: EProduct.MDMA,
        price: 40,
      },
      {
        name: EProduct.METH,
        price: 60,
      },
      {
        name: EProduct.COCAINE,
        price: 100,
      },

      // {
      //   name: EProduct.HEROIN,
      //   price: 50,
      // },
      // {
      //   name: EProduct.KETAMINE,
      //   price: 35,
      // },
      // {
      //   name: EProduct.HASHISH,
      //   price: 25,
      // },
      // {
      //   name: EProduct.PCP,
      //   price: 45,
      // },
      // {
      //   name: EProduct.DMT,
      //   price: 55,
      // },
    ],
  },
];
