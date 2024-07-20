import { IsNumber, Min, ArrayNotEmpty, IsEnum } from 'class-validator';
import { EProduct } from '../product.const';

export class SellProductItemDto {
  @IsEnum(EProduct)
  product: EProduct;

  @IsNumber()
  @Min(1)
  amountToSell: number;
}

export class SellProductDto {
  @ArrayNotEmpty()
  batch: SellProductItemDto[];
}
