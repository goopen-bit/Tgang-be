import { EProduct } from "./market.const";

export interface Event {
  product: EProduct;
  description: string;
  effect: number;
}

export interface Product {
  name: EProduct;
  price: number;
  discountPrice?: number;
  previousPrice?: number;
}

export interface Market {
  id: string;
  name: string;
  products: Product[];
  event?: Event;
}
