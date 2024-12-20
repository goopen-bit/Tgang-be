import { EProduct } from "../market/market.const";

export enum EUpgradeCategory {
  PRODUCT = "product",
  DEALER = "dealer",
  GANGSTER = "gangster", // TODO: Implement gangster upgrades
}

export enum EDealerUpgrade {
  SOCIAL_MEDIA_CAMPAGIN = "social_media_campaign",
  COMBO_PACKS = "combo_packs",
  HIGH_END_PACKAGING = "high_end_packaging",
  PARTY_PACKS = "party_packs",
  HIGH_DOSE_PACKAGES = "high_dose_packages",
  FESTIVAL_BLOTTERS = "festival_blotters",
  BULK_BAGS = "bulk_bags",
}

export type UpgradeRequirementType = 'fixed' | 'linear';
export type RequirementType = 'product' | 'referredUsers';

export interface Requirement {
  product?: EProduct;
  level: number;
  requirement: RequirementType;
  type: UpgradeRequirementType;
}

export interface DealerUpgrade {
  product: EProduct | null;
  title: string;
  description: string;
  basePrice: number;
  upgradeMultiplier: number;
  amountMultiplier: number;
  upgradeTimeMultiplier: number;
  image: string;
  requirements: Requirement[] | null;
}

export interface ProductUpgrade {
  title: string;
  description: string;
  basePrice: number;
  upgradeMultiplier: number;
  upgradeTimeMultiplier: number;
  baseDiscount: number;
  image: string;
  requirements: Requirement[] | null;
}

export interface Upgrade {
  [EUpgradeCategory.PRODUCT]: Record<EProduct, ProductUpgrade>;
  [EUpgradeCategory.DEALER]: Record<EDealerUpgrade, DealerUpgrade>;
  [EUpgradeCategory.GANGSTER]: Record<any, any>;
}
