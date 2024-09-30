import { EProduct } from '../market/market.const';

export enum ECRAFTABLE_ITEM {
  BOOSTER_ATTACK_2 = 'BOOSTER_ATTACK_2',
  BOOSTER_DEFENSE_1 = 'BOOSTER_DEFENSE_1',
  HEALTH_POTION = 'HEALTH_POTION',
}

export type PvpEffect = {
  healthPoints?: number;
  protection?: number;
  damage?: number;
  criticalChance?: number;
  evasion?: number;
  accuracy?: number;
};

export type CraftableItem = {
  itemId: ECRAFTABLE_ITEM;
  requirements: {
    [key in EProduct]?: number;
  };
  pvpEffect: PvpEffect;
  duration: number;
};

export const CRAFTABLE_ITEMS: Record<ECRAFTABLE_ITEM, CraftableItem> = {
  [ECRAFTABLE_ITEM.BOOSTER_ATTACK_2]: {
    itemId: ECRAFTABLE_ITEM.BOOSTER_ATTACK_2,
    requirements: {
      [EProduct.HERB]: 2,
      [EProduct.MUSHROOM]: 1,
    },
    pvpEffect: {
      damage: 2,
      criticalChance: 5,
    },
    duration: 3
  },
  [ECRAFTABLE_ITEM.BOOSTER_DEFENSE_1]: {
    itemId: ECRAFTABLE_ITEM.BOOSTER_DEFENSE_1,
    requirements: {
      [EProduct.ACID]: 1,
      [EProduct.CRYSTAL]: 1,
    },
    pvpEffect: {
      protection: 1,
      evasion: 3,
    },
    duration: 2
  },
  [ECRAFTABLE_ITEM.HEALTH_POTION]: {
    itemId: ECRAFTABLE_ITEM.HEALTH_POTION,
    requirements: {
      [EProduct.HERB]: 1,
      [EProduct.PILL]: 1,
    },
    pvpEffect: {
      healthPoints: 10,
    },
    duration: 1
  },
};

