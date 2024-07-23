import { IsNumber, Min, IsEnum } from 'class-validator';
import { EShipping } from '../shipping.const';
import { EProduct } from '../../product/product.const';

export class ShipProductDto {
  @IsEnum(EShipping)
  shippingMethod: EShipping;

  @IsEnum(EProduct)
  product: EProduct;

  @IsNumber()
  @Min(1)
  amount: number;
}
