import { IsInt } from "class-validator";

export class BuyUpgradeDto {
  @IsInt()
  id: number;
}
