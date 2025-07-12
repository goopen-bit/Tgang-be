import { IsString, IsNumber, Min } from 'class-validator';

export class SwapDto {
  @IsString()
  tokenIn: string;

  @IsString()
  tokenOut: string;

  @IsNumber()
  @Min(0)
  amountIn: number;

  @IsNumber()
  @Min(0)
  minAmountOut: number;
}