import { EProduct } from '../../product/product.const';
import { Event } from '../market.interface';

export const events: Event[] = [
  {
    product: EProduct.WEED,
    description: 'Police crackdown on weed dealers, prices go up',
    effect: 1.5,
  },
  {
    product: EProduct.WEED,
    description: 'Jamaican king arrives to town and floods the market with cheap weed',
    effect: 0.5,
  },
  {
    product: EProduct.COCAINE,
    description: 'Cocaine prices go up due to increased demand',
    effect: 1.5,
  },
  {
    product: EProduct.COCAINE,
    description: 'Huge shipment of cocaine arrived from Colombia, prices go down',
    effect: 0.5,
  },
  {
    product: EProduct.METH,
    description: 'Meth lab explosion, prices go up',
    effect: 1.5,
  },
  {
    product: EProduct.METH,
    description: 'Methhead convention in town, prices go down',
    effect: 0.5,
  },
  {
    product: EProduct.MDMA,
    description: 'Huge rave party in town leaves everyone wanting more MDMA',
    effect: 1.5,
  },
  {
    product: EProduct.MDMA,
    description: 'Police search party finds and destroys MDMA lab',
    effect: 0.5,
  },
  {
    product: EProduct.LSD,
    description: 'Hofmann arrives to town and introduces LSD to the masses',
    effect: 1.5,
  },
  {
    product: EProduct.LSD,
    description: 'Country declares the first Hofmann day, LSD prices go down',
    effect: 0.5,
  },
  {
    product: EProduct.HEROIN,
    description: 'Heroin addiction is on the rise, prices go up',
    effect: 1.5,
  },
  {
    product: EProduct.HEROIN,
    description: 'New heroin substitute is introduced to the market, prices go down',
    effect: 0.5,
  }
]
