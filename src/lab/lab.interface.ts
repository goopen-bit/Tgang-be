export interface Lab {
  title: string;
  description: string;
  labPrice: number;
  baseCapacity: number;
  baseCapacityUpgradePrice: number;
  capacityUpgradeTimeMultiplier: number;
  baseProduction: number;
  baseProductionUpgradePrice: number;
  productionUpgradeTimeMultiplier: number;
  image: string;
  levelRequirement: number;
}
