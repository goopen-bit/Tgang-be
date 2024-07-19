import { EProduct } from '../product/product.const';

interface Product {
  name: EProduct;
  price: number;
}

export interface Market {
  id: string;
  name: string;
  products: Product[];
}
