import { IsNumber, Min, ArrayNotEmpty, IsEnum } from 'class-validator';
import { EProduct } from '../market.const';

export class SellProductItemDto {
  @IsEnum(EProduct)
  product: EProduct;

  @IsNumber()
  @Min(1)
  customers: number;
}

export class SellProductDto {
  @ArrayNotEmpty()
  batch: SellProductItemDto[];
}
