import { EProduct } from '../product/product.const';

interface Product {
  name: EProduct;
  price: number;
  discountPrice?: number;
}

export interface Market {
  id: string;
  name: string;
  products: Product[];
  event?: Event;
}

export interface Event {
  product: EProduct;
  description: string;
  effect: number;
}
