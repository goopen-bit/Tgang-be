import { EShippingMethod } from "./shipping.const";
import { Requirement } from "../upgrade/upgrade.interface";

export interface ShippingMethod {
  title: EShippingMethod;
  description: string;
  basePrice: number;
  baseCapacityUpgradePrice: number;
  capacityPriceMultiplier: number;
  baseCapacity: number;
  baseShippingTimeUpgradePrice: number;
  shippingTimePriceMultiplier: number;
  baseShippingTime: number;
  shippingTimeMultiplier: number;
  image: string;
  requirements: Requirement[] | null;
}
