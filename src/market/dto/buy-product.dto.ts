import { IsEnum, IsInt } from 'class-validator';
import { EProduct } from '../market.const';

export class BuyProductDto {
  @IsEnum(EProduct)
  product: EProduct;

  @IsInt()
  quantity: number;
}
