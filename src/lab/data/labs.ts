import { EProduct } from "../../product/product.const";
import { Lab } from "../lab.interface";

export const labs: Record<EProduct, Lab> = {
  [EProduct.WEED]: {
    title: "Weed Farm",
    description: "A place to grow your own weed.",
    labPrice: 500,
    baseCapacity: 100,
    baseCapacityUpgradePrice: 1000,
    baseProduction: 10,
    baseProductionUpgradePrice: 1200,
    image: `/assets/weed_lab_2.png`,
    levelRequirement: 1
  },
  [EProduct.COCAINE]: {
    title: "Coke Synthesis",
    description: "A place to synthesize the finest coke.",
    labPrice: 800,
    baseCapacity: 200,
    baseCapacityUpgradePrice: 1600,
    baseProduction: 20,
    baseProductionUpgradePrice: 2000,
    image: `/assets/weed_lab_2.png`,
    levelRequirement: 2
  },
  [EProduct.METH]: {
    title: "Meth Lab",
    description: "A place to cook the best meth.",
    labPrice: 1200,
    baseCapacity: 300,
    baseCapacityUpgradePrice: 2000,
    baseProduction: 30,
    baseProductionUpgradePrice: 2400,
    image: `/assets/weed_lab_2.png`,
    levelRequirement: 2
  },
  [EProduct.MDMA]: {
    title: "Ecstasy Lab",
    description: "Create artificial love.",
    labPrice: 1600,
    baseCapacity: 400,
    baseCapacityUpgradePrice: 2400,
    baseProduction: 40,
    baseProductionUpgradePrice: 2800,
    image: `/assets/weed_lab_2.png`,
    levelRequirement: 2
  },
  [EProduct.LSD]: {
    title: "Acid Lab",
    description: "A place to create the best trips.",
    labPrice: 2000,
    baseCapacity: 500,
    baseCapacityUpgradePrice: 2800,
    baseProduction: 50,
    baseProductionUpgradePrice: 3200,
    image: `/assets/weed_lab_2.png`,
    levelRequirement: 2
  },
  [EProduct.HEROIN]: {
    title: "Heroin Lab",
    description: "Where you finally catch the dragon.",
    labPrice: 2400,
    baseCapacity: 600,
    baseCapacityUpgradePrice: 3200,
    baseProduction: 60,
    baseProductionUpgradePrice: 3600,
    image: `/assets/weed_lab_2.png`,
    levelRequirement: 2
  }
};