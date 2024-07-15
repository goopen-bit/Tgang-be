import { EUpgradeCategory } from "../upgrade.interface";

export const farmerUpgrades = {
  category: EUpgradeCategory.FARMER,
  upgrades: [
    {
      id: 2000,
      title: "Weed lab",
      description: "Start your weed production",
      level: 0,
      maxLevel: 5,
      levelPrices: [200, 400, 600, 800, 1600, 3200],
      value: [1.1, 1.2, 1.3, 1.4, 1.42, 1.45],
      image: "/assets/weed_lab_2.png",
      locked: false,
      group: "production",
      requirement: null,
    },
  ],
};
