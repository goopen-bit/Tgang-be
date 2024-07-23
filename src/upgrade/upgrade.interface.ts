import { EProduct } from "../product/product.const";

export enum EUpgradeCategory {
  PRODUCT = "product",
  DEALER = "dealer",
  GANGSTER = "gangster", // TODO: Implement gangster upgrades
}

export enum EDealerUpgrade {
  CUSTOMER_AMOUNT = "customer_amount",
  CUSTOMER_NEEDS = "customer_needs",
}

export interface Requirement {
  product: EProduct;
  level: number;
}

export interface DealerUpgrade {
  title: string;
  description: string;
  basePrice: number;
  upgradeMultiplier: number;
  baseAmount: number;
  amountMultiplier: number;
  image: string;
  requirements: Requirement[] | null;
}

export interface ProductUpgrade {
  title: string;
  description: string;
  basePrice: number;
  upgradeMultiplier: number;
  baseDiscount: number;
  image: string;
  requirements: Requirement[] | null;
}

export interface Upgrade {
  [EUpgradeCategory.PRODUCT]: Record<EProduct, ProductUpgrade>;
  [EUpgradeCategory.DEALER]: Record<EDealerUpgrade, DealerUpgrade>;
  [EUpgradeCategory.GANGSTER]: Record<any, any>;
}
