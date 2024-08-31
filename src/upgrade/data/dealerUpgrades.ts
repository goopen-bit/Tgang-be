import { EProduct } from "../../market/market.const";
import {
  EDealerUpgrade,
  DealerUpgrade,
  ProductUpgrade,
} from "../upgrade.interface";

export const dealerUpgrades: Record<EDealerUpgrade, DealerUpgrade> = {
  [EDealerUpgrade.SOCIAL_MEDIA_CAMPAGIN]: {
    product: null,
    title: "Social Media Campaign",
    description: "Leverage social media to attract more customers.",
    basePrice: 400,
    upgradeMultiplier: 2,
    amountMultiplier: 10,
    image: "/assets/dealer/social_media_campaign.webp",
    requirements: null,
  },
  // [EDealerUpgrade.STREET_PROMOTION_TEAM]: {
  //   product: null,
  //   title: "Street Promotion Team",
  //   description: "Hire a team to promote your product on the streets.",
  //   basePrice: 6000,
  //   upgradeMultiplier: 2,
  //   amountMultiplier: 100,
  //   image: "/assets/dealer/street_promotion_team.webp",
  //   requirements: null,
  // },
  // [EDealerUpgrade.CLUB_PARTNERSHIP]: {
  //   product: null,
  //   title: "Partnership with Clubs",
  //   description: "Partner with local clubs and bars to promote your product.",
  //   basePrice: 8000,
  //   upgradeMultiplier: 2,
  //   amountMultiplier: 100,
  //   image: "/assets/dealer/club_partnership.webp",
  //   requirements: null,
  // },
  [EDealerUpgrade.COMBO_PACKS]: {
    product: EProduct.HERB,
    title: "🌱 Combo Packs",
    description: "Sell 🌱 in combo packs that encourage larger purchases.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/herb_bulk.webp",
    requirements: null,
  },
  [EDealerUpgrade.BULK_BAGS]: {
    product: EProduct.MUSHROOM,
    title: "🍄 Bulk Bags",
    description: "Provide larger bags for bulk purchases.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/mushroom_bulk.webp",
    requirements: [
      {
        product: EProduct.MUSHROOM,
        level: 1,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EDealerUpgrade.FESTIVAL_BLOTTERS]: {
    product: EProduct.ACID,
    title: "🧪 Festival Blotters",
    description:
      "Offer blotters designed for festivals, encouraging larger purchases.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/acid_bulk.webp",
    requirements: [
      {
        product: EProduct.ACID,
        level: 1,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EDealerUpgrade.PARTY_PACKS]: {
    product: EProduct.PILL,
    title: "💊 Party Packs",
    description: "Sell larger quantities for festivals and parties.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/pill_bulk.webp",
    requirements: [
      {
        product: EProduct.PILL,
        level: 1,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EDealerUpgrade.HIGH_DOSE_PACKAGES]: {
    product: EProduct.CRYSTAL,
    title: "💎 High-Dose Packages",
    description: "Offer packages with higher doses for frequent users.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/crystal_bulk.webp",
    requirements: [
      {
        product: EProduct.CRYSTAL,
        level: 1,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EDealerUpgrade.HIGH_END_PACKAGING]: {
    product: EProduct.POWDER,
    title: "🧂 High-End Packaging",
    description: "Offer luxurious packaging that encourages larger buys.",
    basePrice: 2000,
    upgradeMultiplier: 2,
    amountMultiplier: 1,
    image: "/assets/dealer/powder_bulk.webp",
    requirements: [
      {
        product: EProduct.POWDER,
        level: 1,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
};

export const productUpgrades: Record<EProduct, ProductUpgrade> = {
  [EProduct.HERB]: {
    title: "Herb",
    description: "Some good ol'Herbs.",
    basePrice: 500,
    upgradeMultiplier: 1.4,
    baseDiscount: 10,
    image: `/assets/product/herb.webp`,
    requirements: null,
  },
  [EProduct.MUSHROOM]: {
    title: "Mushroom",
    description: "Used by shamans for centuries.",
    basePrice: 800,
    upgradeMultiplier: 1.4,
    baseDiscount: 12,
    image: `/assets/product/mushroom.webp`,
    requirements: [
      {
        product: EProduct.HERB,
        level: 5,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EProduct.ACID]: {
    title: "Acid",
    description: "Hoffman's bicycle ride.",
    basePrice: 1200,
    upgradeMultiplier: 1.4,
    baseDiscount: 15,
    image: `/assets/product/acid.webp`,
    requirements: [
      {
        product: EProduct.MUSHROOM,
        level: 5,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EProduct.PILL]: {
    title: "Pill",
    description: "Feel the love.",
    basePrice: 1600,
    upgradeMultiplier: 1.4,
    baseDiscount: 18,
    image: `/assets/product/pill.webp`,
    requirements: [
      {
        product: EProduct.ACID,
        level: 5,
        requirement: "product",
        type: "fixed",
      },
    ],
  },
  [EProduct.CRYSTAL]: {
    title: "Crystal",
    description: "Hisenberg's blue.",
    basePrice: 2000,
    upgradeMultiplier: 1.4,
    baseDiscount: 20,
    image: `/assets/product/crystal.webp`,
    requirements: [{ level: 3, requirement: "referredUsers", type: "fixed" }],
  },
  [EProduct.POWDER]: {
    title: "Powder",
    description: "Fidel's favorite.",
    basePrice: 2400,
    upgradeMultiplier: 1.4,
    baseDiscount: 22,
    image: `/assets/product/powder.webp`,
    requirements: [{ level: 5, requirement: "referredUsers", type: "fixed" }],
  },
};
