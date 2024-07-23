export interface ShippingMethod {
  title: string;
  description: string;
  basePrice: number;
  baseCapacityUpgradePrice: number;
  baseCapacity: number;
  basShippingTimeUpgradePrice: number;
  basShippingTime: number;
  image: string;
  requirement: Requirement | null;
}

export type UpgradeRequirementType = 'fixed' | 'linear';

export interface Requirement {
  referredUsers: number;
  type: UpgradeRequirementType;
}
