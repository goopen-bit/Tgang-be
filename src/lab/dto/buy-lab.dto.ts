import { IsEnum, IsInt } from "class-validator";
import { EProduct } from "../../product/product.const";

export class BuyLabDto {
  @IsEnum(EProduct)
  labProduct: EProduct;

  @IsInt()
  plotId: number;
}
