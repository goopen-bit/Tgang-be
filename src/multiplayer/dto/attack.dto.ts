import { IsEnum, IsOptional } from "class-validator";
import { ECRAFTABLE_ITEM } from "../../lab/craftable_item.const";

export class AttackDto {
  @IsEnum(ECRAFTABLE_ITEM)
  @IsOptional()
  itemId?: ECRAFTABLE_ITEM;
}