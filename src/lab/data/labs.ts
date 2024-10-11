import { EProduct } from "../../market/market.const";
import { Lab } from "../lab.interface";

export const labs: Record<EProduct, Lab> = {
  [EProduct.HERB]: {
    title: "HERB Farm",
    description: "A place to grow your own herbs.",
    labPrice: 500,
    baseCapacity: 120,
    baseCapacityUpgradePrice: 1000,
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 60,
    baseProductionUpgradePrice: 1200,
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/herb_lab.png`,
    levelRequirement: 1,
  },
  [EProduct.MUSHROOM]: {
    title: "Mushrooms Lab",
    description: "Elevate your mind and your soul.",
    labPrice: 800,
    baseCapacity: 110,
    baseCapacityUpgradePrice: 1600,
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 55,
    baseProductionUpgradePrice: 1800,
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/mushroom_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.ACID]: {
    title: "Acid Lab",
    description: "A place to create the best trips.",
    labPrice: 1200,
    baseCapacity: 100,
    baseCapacityUpgradePrice: 2000,
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 50,
    baseProductionUpgradePrice: 2400,
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/acid_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.PILL]: {
    title: "Pill Lab",
    description: "Create artificial love.",
    labPrice: 1600,
    baseCapacity: 90,
    baseCapacityUpgradePrice: 2400,
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 45,
    baseProductionUpgradePrice: 2800,
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/pill_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.CRYSTAL]: {
    title: "CRYSTAL Lab",
    description: "A place to cook the best crystal.",
    labPrice: 2000,
    baseCapacity: 80,
    baseCapacityUpgradePrice: 2800,
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 40,
    baseProductionUpgradePrice: 3200,
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/crystal_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.POWDER]: {
    title: "Powder Synthesis",
    description: "A place to synthesize the finest Powder.",
    labPrice: 5000,
    baseCapacity: 60,
    baseCapacityUpgradePrice: 3200,
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 40,
    baseProductionUpgradePrice: 5000,
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/powder_lab.png`,
    levelRequirement: 2,
  },
};
