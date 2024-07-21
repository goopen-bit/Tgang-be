import { EProduct } from "../product/product.const";

export enum EUpgradeCategory {
  PRODUCT = "product",
  DEALER = "dealer",
  SHIPPING = "shipping",
  GANGSTER = "gangster", // TODO: Implement gangster upgrades
}

export enum EDealerUpgrade {
  CUSTOMER_AMOUNT = "customer_amount",
  CUSTOMER_NEEDS = "customer_needs",
}

export enum EShippingUpgrade {
  SHIPPING_TIME = "shipping_time",
  SHIPPING_CONTAINERS = "shipping_containers",
}

export interface Requirement {
  product: EProduct;
  level: number;
}

export interface ShippingUpgrade {
  title: string;
  description: string;
  basePrice: number;
  upgradeMultiplier: number;
  baseAmount: number;
  amountMultiplier: number;
  image: string;
  requirements: Requirement[] | null;
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
  [EUpgradeCategory.SHIPPING]: Record<EShippingUpgrade, ShippingUpgrade>;
  [EUpgradeCategory.GANGSTER]: Record<any, any>;
}
