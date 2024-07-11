import { IsInt, IsString } from "class-validator";

export class BuyUpgradeDto {
  @IsInt()
  id: number;

  @IsString()
  group: string;
}
