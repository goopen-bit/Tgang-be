import { EShippingMethod } from "../shipping.const";
import { ShippingMethod } from "../shipping.interface";

export const shippingMethods: Record<EShippingMethod, ShippingMethod> = {
  [EShippingMethod.ENVELOPE]: {
    title: EShippingMethod.ENVELOPE,
    description: "Send your goods in an envelope.",
    basePrice: 100,
    baseCapacityUpgradePrice: 100,
    baseCapacity: 10,
    basShippingTimeUpgradePrice: 100,
    basShippingTime: 60 * 60 * 24,
    image: "/assets/shipping/envelope.webp",
    requirement: null,
  },
  [EShippingMethod.PACKAGE]: {
    title: EShippingMethod.PACKAGE,
    description: "Send your goods in a package.",
    basePrice: 500,
    baseCapacityUpgradePrice: 500,
    baseCapacity: 50,
    basShippingTimeUpgradePrice: 500,
    basShippingTime: 60 * 60 * 24,
    image: "/assets/shipping/package.webp",
    requirement: null,
  },
  [EShippingMethod.PALLET]: {
    title: EShippingMethod.PALLET,
    description: "Send your goods in a pallet.",
    basePrice: 2500,
    baseCapacityUpgradePrice: 2500,
    baseCapacity: 500,
    basShippingTimeUpgradePrice: 2500,
    basShippingTime: 60 * 60 * 24,
    image: "/assets/shipping/pallet.webp",
    requirement: null,
  },
  [EShippingMethod.TRUCK]: {
    title: EShippingMethod.TRUCK,
    description: "Send your goods in a truck.",
    basePrice: 5000,
    baseCapacityUpgradePrice: 10000,
    baseCapacity: 5000,
    basShippingTimeUpgradePrice: 10000,
    basShippingTime: 60 * 60 * 24,
    image: "/assets/shipping/truck.webp",
    requirement: null,
  },
  [EShippingMethod.CONTAINER]: {
    title: EShippingMethod.CONTAINER,
    description: "Send your goods in a container.",
    basePrice: 10000,
    baseCapacityUpgradePrice: 1000000,
    baseCapacity: 1000000,
    basShippingTimeUpgradePrice: 1000000,
    basShippingTime: 60 * 60 * 48,
    image: "/assets/shipping/container.webp",
    requirement: {
      referredUsers: 2,
      type: "fixed",
    },
  },
  [EShippingMethod.PLANE]: {
    title: EShippingMethod.PLANE,
    description: "Send your goods in a plane.",
    basePrice: 5000,
    baseCapacityUpgradePrice: 10000,
    baseCapacity: 1000,
    basShippingTimeUpgradePrice: 10000,
    basShippingTime: 60 * 60 * 6,
    image: "/assets/shipping/plane.webp",
    requirement: {
      referredUsers: 2,
      type: "linear",
    },
  },
  [EShippingMethod.ROCKET]: {
    title: EShippingMethod.ROCKET,
    description: "Send your goods in a plane.",
    basePrice: 1000000,
    baseCapacityUpgradePrice: 1000000,
    baseCapacity: 500,
    basShippingTimeUpgradePrice: 10000,
    basShippingTime: 60 * 60 * 2,
    image: "/assets/shipping/rocket.webp",
    requirement: {
      referredUsers: 5,
      type: "linear",
    },
  },
};
