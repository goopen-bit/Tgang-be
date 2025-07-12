import { IsEnum, IsInt } from 'class-validator';
import { EProduct } from '../../config/types';

export class BuyLabDto {
  @IsEnum(EProduct)
  labProduct: EProduct;

  @IsInt()
  plotId: number;
}
