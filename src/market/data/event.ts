import { EProduct } from "../market.const";
import { Event } from "../market.interface";

export const events: Event[] = [
  {
    product: EProduct.HERB,
    description: "Police crackdown on HERB dealers, prices go up",
    effect: 1.5,
  },
  {
    product: EProduct.HERB,
    description:
      "Jamaican king arrives to town and floods the market with cheap HERB",
    effect: 0.5,
  },
  {
    product: EProduct.POWDER,
    description: "POWDER prices go up due to increased demand",
    effect: 1.5,
  },
  {
    product: EProduct.POWDER,
    description:
      "Huge shipment of POWDER arrived from Colombia, prices go down",
    effect: 0.5,
  },
  {
    product: EProduct.CRYSTAL,
    description: "Crystal lab explosion, prices go up",
    effect: 1.5,
  },
  {
    product: EProduct.CRYSTAL,
    description: "Crystal head convention in town, prices go down",
    effect: 0.5,
  },
  {
    product: EProduct.PILL,
    description: "Huge rave party in town leaves everyone wanting more PILL",
    effect: 1.5,
  },
  {
    product: EProduct.PILL,
    description: "Police search party finds and destroys PILL lab",
    effect: 0.5,
  },
  {
    product: EProduct.ACID,
    description: "Hofmann arrives to town and introduces ACID to the masses",
    effect: 1.5,
  },
  {
    product: EProduct.ACID,
    description: "Country declares the first Hofmann day, ACID prices go down",
    effect: 0.5,
  },
];
