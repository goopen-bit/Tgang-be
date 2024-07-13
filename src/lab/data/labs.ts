import { EProduct } from "../../product/product.const";
import { Lab } from "../lab.interface";

export const labs: Record<EProduct, Lab> = {
  [EProduct.WEED]: {
    id: 1,
    title: "Weed Farm",
    description: "A place to grow your own weed.",
    labPrice: 500,
    baseCapacity: 100,
    baseCapacityUpgradePrice: 1000,
    baseProduction: 10,
    baseProductionUpgradePrice: 1200,
    image: `/assets/weed_lab_2.png`,
  },
  [EProduct.COCAINE]: {
    id: 2,
    title: "Coke Synthesis",
    description: "A place to synthesize the finest coke.",
    labPrice: 800,
    baseCapacity: 200,
    baseCapacityUpgradePrice: 1600,
    baseProduction: 20,
    baseProductionUpgradePrice: 2000,
    image: `/assets/weed_lab_2.png`,
  },
  [EProduct.METH]: {
    id: 3,
    title: "Meth Lab",
    description: "A place to cook the best meth.",
    labPrice: 1200,
    baseCapacity: 300,
    baseCapacityUpgradePrice: 2000,
    baseProduction: 30,
    baseProductionUpgradePrice: 2400,
    image: `/assets/weed_lab_2.png`,
  },
  [EProduct.MDMA]: undefined,
  [EProduct.LSD]: undefined,
  [EProduct.HEROIN]: undefined
};