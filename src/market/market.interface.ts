interface Product {
  name: string;
  price: number;
}

export interface Market {
  id: string;
  name: string;
  products: Product[];
}
