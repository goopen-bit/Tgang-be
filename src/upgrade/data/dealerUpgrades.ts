import { EProduct } from "../../product/product.const";
import {
  EDealerUpgrade,
  DealerUpgrade,
  ProductUpgrade,
} from "../upgrade.interface";

export const dealerUpgrades: Record<EDealerUpgrade, DealerUpgrade> = {
  [EDealerUpgrade.SOCIAL_MEDIA_CAMPAGIN]: {
    title: "Social Media Campaign",
    description: "Leverage social media to attract more customers.",
    basePrice: 4000,
    upgradeMultiplier: 2,
    amountMultiplier: 100,
    image: "/assets/dealer/social_media_campaign.webp",
    requirements: null,
  },
  [EDealerUpgrade.STREET_PROMOTION_TEAM]: {
    title: "Street Promotion Team",
    description: "Hire a team to promote your product on the streets.",
    basePrice: 6000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/street_promotion_team.webp",
    requirements: null,
  },
  [EDealerUpgrade.CLUB_PARTNERSHIP]: {
    title: "Partnership with Clubs",
    description: "Partner with local clubs and bars to promote your product.",
    basePrice: 8000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/club_partnership.webp",
    requirements: null,
  },
  [EDealerUpgrade.PRODUCT_QUALITY]: {
    title: "Increase Product Quality",
    description: "Invest in better materials to increase the quality of your product.",
    basePrice: 4000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/product_quality.webp",
    requirements: null,
  },
  [EDealerUpgrade.LUXURY_PACKAGING]: {
    title: "Luxury Packaging",
    description: "Improve packaging to make the product look more appealing and high-end.",
    basePrice: 6000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/luxury_packaging.webp",
    requirements: null,
  },
  [EDealerUpgrade.HIGH_VALUE_CUSTOMERS]: {
    title: "Target High-Value Customers",
    description: "Focus on attracting wealthier customers who buy in larger quantities.",
    basePrice: 8000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/high_value_customers.webp",
    requirements: null,
  },
};

export const productUpgrades: Record<EProduct, ProductUpgrade> = {
  [EProduct.WEED]: {
    title: "Weed",
    description: "Unlock new customers and reduce market price.",
    basePrice: 500,
    upgradeMultiplier: 2,
    baseDiscount: 10,
    image: `/assets/labs/weed_lab.png`,
    requirements: null,
  },
  [EProduct.COCAINE]: {
    title: "Coke",
    description: "Unlock new customers and reduce market price.",
    basePrice: 800,
    upgradeMultiplier: 2,
    baseDiscount: 12,
    image: `/assets/labs/coke_lab.png`,
    requirements: [{ product: EProduct.WEED, level: 5 }],
  },
  [EProduct.METH]: {
    title: "Meth",
    description: "Unlock new customers and reduce market price.",
    basePrice: 1200,
    upgradeMultiplier: 2,
    baseDiscount: 15,
    image: `/assets/labs/meth_lab.png`,
    requirements: [{ product: EProduct.COCAINE, level: 5 }],
  },
  [EProduct.MDMA]: {
    title: "Ecstasy",
    description: "Unlock new customers and reduce market price.",
    basePrice: 1600,
    upgradeMultiplier: 2,
    baseDiscount: 18,
    image: `/assets/labs/mdma_lab.png`,
    requirements: [{ product: EProduct.METH, level: 5 }],
  },
  [EProduct.LSD]: {
    title: "Acid",
    description: "Unlock new customers and reduce market price.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    baseDiscount: 20,
    image: `/assets/labs/lsd_lab.png`,
    requirements: [{ product: EProduct.MDMA, level: 5 }],
  },
  [EProduct.MUSHROOM]: {
    title: "Mushroom",
    description: "Unlock new customers and reduce market price.",
    basePrice: 2400,
    upgradeMultiplier: 2,
    baseDiscount: 22,
    image: `/assets/labs/mushroom_lab.png`,
    requirements: [{ product: EProduct.LSD, level: 5 }],
  },
};
