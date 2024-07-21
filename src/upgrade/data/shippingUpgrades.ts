import { EShippingUpgrade, ShippingUpgrade } from "../upgrade.interface";

export const shippingUpgrades: Record<EShippingUpgrade, ShippingUpgrade> = {
  [EShippingUpgrade.SHIPPING_TIME]: {
    title: "Shipping Time",
    description: "Decrease the time it takes to ship products",
    basePrice: 10000,
    upgradeMultiplier: 2,
    baseAmount: 24 * 3600,
    amountMultiplier: 1.1,
    image: "/assets/hero.png",
    requirements: null,
  },
  [EShippingUpgrade.SHIPPING_CONTAINERS]: {
    title: "Shipping Containers",
    description: "Increase the amount of containers you can ship",
    basePrice: 5000,
    upgradeMultiplier: 2,
    baseAmount: 0,
    amountMultiplier: 1,
    image: "/assets/hero.png",
    requirements: null,
  },
};
