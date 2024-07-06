import { IsEnum, IsInt, IsString } from 'class-validator';
import { EProduct } from '../product.const';

export class SellProductDto {
  @IsString()
  name: string;

  @IsEnum(EProduct)
  product: EProduct;

  @IsInt()
  quantity: number;
}
