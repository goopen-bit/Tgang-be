import { EUpgradeCategory } from "../upgrade.interface";

// All monetary values are stored in cents to avoid floating point precision issues
export const gangsterUpgrades = {
  category: EUpgradeCategory.GANGSTER,
  upgrades: [
    {
      id: 3000,
      title: "Workout",
      description: "Increase your health score",
      level: 0,
      maxLevel: 5,
      levelPrices: [20000, 40000, 60000, 80000, 160000, 320000], // $200, $400, $600, $800, $1600, $3200 in cents
      value: [1000, 1100, 1300, 1400, 1500, 1600],
      image:
        "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg",
      locked: false,
      group: "stats",
      requirements: null,
    },
  ],
};
