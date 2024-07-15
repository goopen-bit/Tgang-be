export enum EUpgradeCategory {
  DEALER = "dealer",
  FARMER = "farmer",
  GANGSTER = "gangster",
}

export interface Requirement {
  title: string;
  level: number;
}

export interface Upgrade {
  id: number;
  title: string;
  description: string;
  level: number;
  maxLevel: number;
  levelPrices: number[];
  value: number[];
  image: string;
  locked: boolean;
  group: string;
  requirement: Requirement | null;
}

export interface UpgradesCategory {
  category: EUpgradeCategory;
  upgrades: Upgrade[];
}
