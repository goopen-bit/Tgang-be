import { EProduct } from '../../product/product.const';
import {
  DealerUpgrade,
  EDealerUpgrade,
  EUpgradeCategory,
} from '../upgrade.interface';
import { dealerUpgrades, productUpgrades } from './dealerUpgrades';
import { gangsterUpgrades } from './gangsterUpgrades';
import { shippingUpgrades } from './shippingUpgrades';

export const upgradesData: Record<
  EUpgradeCategory,
  Record<EProduct | EDealerUpgrade | any, DealerUpgrade | any>
> = {
  [EUpgradeCategory.PRODUCT]: productUpgrades,
  [EUpgradeCategory.DEALER]: dealerUpgrades,
  [EUpgradeCategory.SHIPPING]: shippingUpgrades,
  [EUpgradeCategory.GANGSTER]: gangsterUpgrades,
};
