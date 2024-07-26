import { EShippingMethod } from "./shipping.const";

export interface ShippingMethod {
  title: EShippingMethod;
  description: string;
  basePrice: number;
  baseCapacityUpgradePrice: number;
  baseCapacity: number;
  baseShippingTimeUpgradePrice: number;
  baseShippingTime: number;
  image: string;
  requirement: Requirement | null;
}

export type UpgradeRequirementType = 'fixed' | 'linear';

export interface Requirement {
  referredUsers: number;
  type: UpgradeRequirementType;
}
