import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsString } from "class-validator";
import { EProduct } from "../../market/market.const";
import { UserPvp } from "../../user/schemas/userPvp.schema";

export class BattleParticipantDto extends UserPvp {
  @IsNumber()
  id: number;
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
