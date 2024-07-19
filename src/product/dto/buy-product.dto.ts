import { IsEnum, IsInt } from 'class-validator';
import { EProduct } from '../product.const';

export class BuyProductDto {
  @IsEnum(EProduct)
  product: EProduct;

  @IsInt()
  quantity: number;
}
