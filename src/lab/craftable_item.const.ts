import { EProduct } from "../market/market.const";

export enum ECRAFTABLE_ITEM {
  BOOSTER_ATTACK_1 = "BOOSTER_ATTACK_1",
  BOOSTER_DEFENSE_1 = "BOOSTER_DEFENSE_1",
  HEALTH_POTION_SMALL = "HEALTH_POTION_SMALL",
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
  // Total ~361$
  // User miss an attack of ~15 by using the item but gain 10 attack in 3 round
  // 4 rounds without potion 4*15 = 60 damage
  // 4 rounds with potion 3*25 = 75 damage
  [ECRAFTABLE_ITEM.BOOSTER_ATTACK_1]: {
    itemId: ECRAFTABLE_ITEM.BOOSTER_ATTACK_1,
    requirements: {
      [EProduct.POWDER]: 2,
      [EProduct.PILL]: 2,
    },
    pvpEffect: {
      damage: 10,
      criticalChance: 3,
    },
    duration: 3,
  },
  // Total ~325$
  // user will absorb 21 damage so 1.4 attack that's why it's a bit more expensive than the health potion
  [ECRAFTABLE_ITEM.BOOSTER_DEFENSE_1]: {
    itemId: ECRAFTABLE_ITEM.BOOSTER_DEFENSE_1,
    requirements: {
      [EProduct.HERB]: 10,
      [EProduct.MUSHROOM]: 5,
    },
    pvpEffect: {
      protection: 7,
      evasion: 3,
    },
    duration: 3,
  },
  // Total ~276$
  // Based on normal attack of 15 user will actually gain 10 hp
  [ECRAFTABLE_ITEM.HEALTH_POTION_SMALL]: {
    itemId: ECRAFTABLE_ITEM.HEALTH_POTION_SMALL,
    requirements: {
      [EProduct.HERB]: 10,
      [EProduct.ACID]: 3,
    },
    pvpEffect: {
      healthPoints: 25,
    },
    duration: 1,
  },
};
