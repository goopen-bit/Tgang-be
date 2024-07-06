import { EProduct } from "../product/product.const";

export interface Customer {
  name: string;
  product: EProduct;
  price: number;
  quantity: number;
}
