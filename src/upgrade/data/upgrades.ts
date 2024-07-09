import { UpgradesCategory } from "../upgrade.interface";

export enum EUpgrade {
  COKE,
  METH,
  HEROIN,
  WEED_LAB,
  WORKOUT,
}

export enum EUpgradeCategory {
  DEALER,
  FARMER,
  GANGSTER,
}

export const upgradesData: UpgradesCategory[] = [
  {
    category: "dealer",
    upgrades: [
      {
        id: 1,
        title: "Coke",
        description: "Get a new dealer with cheaper price",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1600, 3200],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "/assets/cc.png",
        locked: false,
        group: "product",
        requirement: null,
      },
      {
        id: 2,
        title: "Meth",
        description: "Get a new dealer with cheaper price",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1600, 3200],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "/assets/meth.png",
        locked: true,
        group: "product",
        requirement: { title: "Coke", level: 1 },
      },
      {
        id: 3,
        title: "Heroin",
        description: "Get a new dealer with cheaper price",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1600, 3200],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "/assets/hero.png",
        locked: true,
        group: "product",
        requirement: { title: "Meth", level: 1 },
      },
    ],
  },
  {
    category: "farmer",
    upgrades: [
      {
        id: 4,
        title: "Weed_lab",
        description: "Start your weed production",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1600, 3200],
        value: [1.1, 1.2, 1.3, 1.4, 1.42, 1.45],
        image: "/assets/weed_lab_small.png",
        locked: false,
        group: "production",
        requirement: null,
      },
    ],
  },
  {
    category: "gangster",
    upgrades: [
      {
        id: 5,
        title: "Workout",
        description: "Increase your health score",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1600, 3200],
        value: [1000, 1100, 1300, 1400, 1500, 1600],
        image:
          "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg",
        locked: false,
        group: "stats",
        requirement: null,
      },
    ],
  },
];
