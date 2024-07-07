import { IsInt, IsEnum } from "class-validator";
import { EProduct } from "../../product/product.const";

export class CustomerBatchDto {
  @IsEnum(EProduct)
  product: EProduct;

  @IsInt()
  quantity: number;

  @IsInt()
  customerIndex: number;
}