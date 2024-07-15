import { UpgradesCategory } from "../upgrade.interface";
import { dealerUpgrades } from "./dealerUpgrades";
import { farmerUpgrades } from "./farmerUpgrades";
import { gangsterUpgrades } from "./gangsterUpgrades";

export const upgradesData: UpgradesCategory[] = [
  dealerUpgrades,
  farmerUpgrades,
  gangsterUpgrades,
];
