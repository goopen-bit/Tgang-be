import { EProduct } from "../../config/types";
import { Lab } from "../lab.interface";

// All monetary values are stored in cents to avoid floating point precision issues
export const labs: Record<EProduct, Lab> = {
  [EProduct.HERB]: {
    title: "HERB Farm",
    description: "A place to grow your own herbs.",
    labPrice: 50000, // $500.00 in cents
    baseCapacity: 120,
    baseCapacityUpgradePrice: 100000, // $1000.00 in cents
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 60,
    baseProductionUpgradePrice: 120000, // $1200.00 in cents
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/herb_lab.png`,
    levelRequirement: 1,
  },
  [EProduct.MUSHROOM]: {
    title: "Mushrooms Lab",
    description: "Elevate your mind and your soul.",
    labPrice: 80000, // $800.00 in cents
    baseCapacity: 110,
    baseCapacityUpgradePrice: 160000, // $1600.00 in cents
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 55,
    baseProductionUpgradePrice: 180000, // $1800.00 in cents
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/mushroom_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.ACID]: {
    title: "Acid Lab",
    description: "A place to create the best trips.",
    labPrice: 120000, // $1200.00 in cents
    baseCapacity: 100,
    baseCapacityUpgradePrice: 200000, // $2000.00 in cents
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 50,
    baseProductionUpgradePrice: 240000, // $2400.00 in cents
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/acid_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.PILL]: {
    title: "Pill Lab",
    description: "Create artificial love.",
    labPrice: 160000, // $1600.00 in cents
    baseCapacity: 90,
    baseCapacityUpgradePrice: 240000, // $2400.00 in cents
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 45,
    baseProductionUpgradePrice: 280000, // $2800.00 in cents
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/pill_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.CRYSTAL]: {
    title: "CRYSTAL Lab",
    description: "A place to cook the best crystal.",
    labPrice: 200000, // $2000.00 in cents
    baseCapacity: 80,
    baseCapacityUpgradePrice: 280000, // $2800.00 in cents
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 40,
    baseProductionUpgradePrice: 320000, // $3200.00 in cents
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/crystal_lab.png`,
    levelRequirement: 2,
  },
  [EProduct.POWDER]: {
    title: "Powder Synthesis",
    description: "A place to synthesize the finest Powder.",
    labPrice: 500000, // $5000.00 in cents
    baseCapacity: 60,
    baseCapacityUpgradePrice: 320000, // $3200.00 in cents
    capacityUpgradeTimeMultiplier: 2,
    baseProduction: 40,
    baseProductionUpgradePrice: 500000, // $5000.00 in cents
    productionUpgradeTimeMultiplier: 2,
    image: `/assets/labs/powder_lab.png`,
    levelRequirement: 2,
  },
};
