export interface ShippingMethod {
  title: string;
  description: string;
  basePrice: number;
  baseCapacityUpgradePrice: number;
  baseCapacity: number;
  basShippingTimeUpgradePrice: number;
  basShippingTime: number;
  image: string;
  requirement: any;
}
