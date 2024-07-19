import { EProduct } from 'src/product/product.const';
import {
  DealerUpgrade,
  EDealerUpgrade,
  EUpgradeCategory,
} from '../upgrade.interface';
import { dealerUpgrades, productUpgrades } from './dealerUpgrades';
import { gangsterUpgrades } from './gangsterUpgrades';

export const upgradesData: Record<
  EUpgradeCategory,
  Record<EProduct | EDealerUpgrade | any, DealerUpgrade | any>
> = {
  [EUpgradeCategory.PRODUCT]: productUpgrades,
  [EUpgradeCategory.DEALER]: dealerUpgrades,
  [EUpgradeCategory.GANGSTER]: gangsterUpgrades,
};
