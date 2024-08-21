import { EShippingMethod } from "./shipping.const";
import { Requirement } from "../upgrade/upgrade.interface";

export interface ShippingMethod {
  title: EShippingMethod;
  description: string;
  basePrice: number;
  baseCapacityUpgradePrice: number;
  baseCapacity: number;
  baseShippingTimeUpgradePrice: number;
  baseShippingTime: number;
  image: string;
  requirements: Requirement[] | null;
}
