import { EUpgradeCategory } from "../upgrade.interface";

export const gangsterUpgrades = {
  category: EUpgradeCategory.GANGSTER,
  upgrades: [
    {
      id: 3000,
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
      requirements: null,
    },
  ],
};
