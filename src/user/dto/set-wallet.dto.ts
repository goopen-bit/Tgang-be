import { IsString } from "class-validator";

export class setWalletDto {
  @IsString()
  tonWalletAddress: string;
}
