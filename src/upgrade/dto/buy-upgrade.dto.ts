import { IsInt, IsString } from "class-validator";
import { EUpgradeCategory } from "../upgrade.interface";

export class BuyUpgradeDto {
  @IsInt()
  id: number;
}
