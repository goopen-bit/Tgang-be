import { IsString, IsNumber, Min, ArrayNotEmpty } from 'class-validator';

export class SellProductItemDto {
  @IsString()
  product: string;

  @IsNumber()
  @Min(1)
  amountToSell: number;
}

export class SellProductDto {
  @ArrayNotEmpty()
  batch: SellProductItemDto[];
}
