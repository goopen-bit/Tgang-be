import { IsEnum } from "class-validator";
import { EProduct } from "../../market/market.const";

export class AttackDto {
  @IsEnum(EProduct)
  product?: EProduct;
}