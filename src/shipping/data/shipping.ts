import { EShippingMethod } from "../shipping.const";
import { ShippingMethod } from "../shipping.interface";

export const shippingMethods: Record<EShippingMethod, ShippingMethod> = {
  [EShippingMethod.ENVELOPE]: {
    title: EShippingMethod.ENVELOPE,
    description: "Simple envelope for small and quick deliveries.",
    basePrice: 100,
    baseCapacityUpgradePrice: 100,
    baseCapacity: 10,
    baseShippingTimeUpgradePrice: 100,
    baseShippingTime: 60 * 60 * 2,
    image: "/assets/shipping/envelope.webp",
    requirements: null,
  },
  [EShippingMethod.PACKAGE]: {
    title: EShippingMethod.PACKAGE,
    description: "A package for medium goods and fairly quick deliveries.",
    basePrice: 500,
    baseCapacityUpgradePrice: 500,
    baseCapacity: 50,
    baseShippingTimeUpgradePrice: 500,
    baseShippingTime: 60 * 60 * 3,
    image: "/assets/shipping/package.webp",
    requirements: null,
  },
  [EShippingMethod.PALLET]: {
    title: EShippingMethod.PALLET,
    description: "Large pallet for big goods and efficient deliveries.",
    basePrice: 2500,
    baseCapacityUpgradePrice: 2500,
    baseCapacity: 500,
    baseShippingTimeUpgradePrice: 2500,
    baseShippingTime: 60 * 60 * 6,
    image: "/assets/shipping/pallet.webp",
    requirements: null,
  },
  [EShippingMethod.TRUCK]: {
    title: EShippingMethod.TRUCK,
    description: "A slow truck that can carry a lot of goods.",
    basePrice: 100000,
    baseCapacityUpgradePrice: 50000,
    baseCapacity: 5000,
    baseShippingTimeUpgradePrice: 50000,
    baseShippingTime: 60 * 60 * 24,
    image: "/assets/shipping/truck.webp",
    requirements: null,
  },
  [EShippingMethod.CONTAINER]: {
    title: EShippingMethod.CONTAINER,
    description: "Your own container on a ship. Slow but very efficient.",
    basePrice: 250000,
    baseCapacityUpgradePrice: 100000,
    baseCapacity: 10000,
    baseShippingTimeUpgradePrice: 100000,
    baseShippingTime: 60 * 60 * 48,
    image: "/assets/shipping/container.webp",
    requirements: [{
      level: 2,
      requirement: "referredUsers",
      type: "fixed",
    }],
  },
  [EShippingMethod.PLANE]: {
    title: EShippingMethod.PLANE,
    description: "A small plane. Reasonably large capacity and fast.",
    basePrice: 500000,
    baseCapacityUpgradePrice: 500000,
    baseCapacity: 1000,
    baseShippingTimeUpgradePrice: 500000,
    baseShippingTime: 60 * 60 * 12,
    image: "/assets/shipping/plane.webp",
    requirements: [{
      level: 2,
      requirement: "referredUsers",
      type: "linear",
    }],
  },
  [EShippingMethod.ROCKET]: {
    title: EShippingMethod.ROCKET,
    description: "Your own fricking rocket. Deliver everywhere in no time.",
    basePrice: 1000000,
    baseCapacityUpgradePrice: 1000000,
    baseCapacity: 500,
    baseShippingTimeUpgradePrice: 1000000,
    baseShippingTime: 60 * 60 * 2,
    image: "/assets/shipping/rocket.webp",
    requirements: [{
      level: 5,
      requirement: "referredUsers",
      type: "linear",
    }],
  },
};
