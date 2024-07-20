import { EProduct } from '../../product/product.const';
import {
  EDealerUpgrade,
  DealerUpgrade,
  ProductUpgrade,
} from '../upgrade.interface';

export const dealerUpgrades: Record<EDealerUpgrade, DealerUpgrade> = {
  [EDealerUpgrade.CUSTOMER_AMOUNT]: {
    title: 'Customer Amount',
    description: 'Increase the number of customer per hour',
    basePrice: 4000,
    upgradeMultiplier: 2,
    baseAmount: 3600,
    amountMultiplier: 100,
    image: '/assets/hero.png',
    requirement: null,
  },
  [EDealerUpgrade.CUSTOMER_NEEDS]: {
    title: 'Customer Needs',
    description: 'Increase the amount of product that customer wants',
    basePrice: 5000,
    upgradeMultiplier: 2,
    baseAmount: 1,
    amountMultiplier: 1,
    image: '/assets/hero.png',
    requirement: null,
  },
};

export const productUpgrades: Record<EProduct, ProductUpgrade> = {
  [EProduct.WEED]: {
    title: 'Weed',
    description: 'Unlock new customers and reduce market price.',
    basePrice: 500,
    upgradeMultiplier: 2,
    baseDiscount: 10,
    image: `/assets/weed_lab_2.png`,
    requirement: null,
  },
  [EProduct.COCAINE]: {
    title: 'Coke',
    description: 'Unlock new customers and reduce market price.',
    basePrice: 800,
    upgradeMultiplier: 2,
    baseDiscount: 12,
    image: `/assets/weed_lab_2.png`,
    requirement: { product: EProduct.WEED, level: 5 },
  },
  [EProduct.METH]: {
    title: 'Meth',
    description: 'Unlock new customers and reduce market price.',
    basePrice: 1200,
    upgradeMultiplier: 2,
    baseDiscount: 15,
    image: `/assets/weed_lab_2.png`,
    requirement: { product: EProduct.COCAINE, level: 5 },
  },
  [EProduct.MDMA]: {
    title: 'Ecstasy',
    description: 'Unlock new customers and reduce market price.',
    basePrice: 1600,
    upgradeMultiplier: 2,
    baseDiscount: 18,
    image: `/assets/weed_lab_2.png`,
    requirement: { product: EProduct.METH, level: 5 },
  },
  [EProduct.LSD]: {
    title: 'Acid',
    description: 'Unlock new customers and reduce market price.',
    basePrice: 2000,
    upgradeMultiplier: 2,
    baseDiscount: 20,
    image: `/assets/weed_lab_2.png`,
    requirement: { product: EProduct.MDMA, level: 5 },
  },
  [EProduct.HEROIN]: {
    title: 'Heroin',
    description: 'Unlock new customers and reduce market price.',
    basePrice: 2400,
    upgradeMultiplier: 2,
    baseDiscount: 22,
    image: `/assets/weed_lab_2.png`,
    requirement: { product: EProduct.LSD, level: 5 },
  },
};
