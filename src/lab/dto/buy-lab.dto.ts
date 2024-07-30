import { IsEnum, IsInt } from 'class-validator';
import { EProduct } from '../../market/market.const';

export class BuyLabDto {
  @IsEnum(EProduct)
  labProduct: EProduct;

  @IsInt()
  plotId: number;
}
