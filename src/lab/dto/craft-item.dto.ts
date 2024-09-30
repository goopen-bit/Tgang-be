import { IsEnum, IsNumber, Min } from 'class-validator';
import { ECRAFTABLE_ITEM } from '../craftable_item.const';

export class CraftItemDto {
  @IsEnum(ECRAFTABLE_ITEM)
  itemId: ECRAFTABLE_ITEM;

  @IsNumber()
  @Min(1)
  quantity: number;
}
