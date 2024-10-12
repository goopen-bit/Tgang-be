import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsString,
  IsOptional,
} from "class-validator";
import { EProduct } from "../../market/market.const";
import { UserPvp } from "../../user/schemas/userPvp.schema";
import { ECRAFTABLE_ITEM } from "../../lab/craftable_item.const";

export class StartBattleDto {
  @IsArray()
  @IsEnum(ECRAFTABLE_ITEM, { each: true })
  @ArrayMaxSize(2)
  @IsOptional()
  selectedItemIds?: ECRAFTABLE_ITEM[];
}

export class BattleParticipantDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsObject()
  pvp: UserPvp;

  @IsArray()
  selectedItems?: { itemId: ECRAFTABLE_ITEM; quantity: number }[];
}

export class RoundResultDto {
  @IsNumber()
  attackerDamage: number;

  @IsNumber()
  defenderDamage: number;

  @IsBoolean()
  attackerCritical: boolean;

  @IsBoolean()
  defenderCritical: boolean;

  @IsEnum(ECRAFTABLE_ITEM)
  usedItem?: ECRAFTABLE_ITEM;
}

export class AttackItemEffect {
  @IsObject()
  player: BattleParticipantDto;

  @IsNumber()
  quantity: number;
}

export class LootDto {
  @IsEnum(EProduct)
  name: EProduct;

  @IsNumber()
  quantity: number;
}

export class BattleDto {
  @IsString()
  battleId: string;

  @IsObject()
  attacker: BattleParticipantDto;

  @IsObject()
  defender: BattleParticipantDto;

  @IsNumber()
  round: number;

  @IsArray()
  roundResults: RoundResultDto[];

  @IsString()
  winner?: string;

  @IsNumber()
  cashLoot?: number;

  @IsArray()
  productLoot?: LootDto[];
}
