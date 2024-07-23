import { IsNumber, Min, IsEnum } from 'class-validator';
import { EShippingMethod } from '../shipping.const';
import { EProduct } from '../../product/product.const';

export class ShipProductDto {
  @IsEnum(EShippingMethod)
  shippingMethod: EShippingMethod;

  @IsEnum(EProduct)
  product: EProduct;

  @IsNumber()
  @Min(1)
  amount: number;
}
