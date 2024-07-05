import { IsEnum, IsInt } from 'class-validator';
import { EProduct } from '../../product/product.const';

export class BuyProductDto {
  @IsEnum(EProduct)
  product: EProduct;

  @IsInt()
  quantity: number;
}