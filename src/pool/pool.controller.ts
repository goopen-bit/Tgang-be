import { Body, Controller, Get, Post } from '@nestjs/common';
import { PoolService } from './pool.service';
import { Auth } from '../decorators/auth.decorator';
import { SwapDto } from './dto/swap.dto';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';

@Auth()
@Controller('pools')
export class PoolController {
  constructor(private poolService: PoolService) {}

  @Get()
  async getPools() {
    return this.poolService.getPools();
  }

  @Post('swap')
  async swap(
    @GetAuthToken() user: AuthTokenData,
    @Body() swapDto: SwapDto,
  ) {
    return this.poolService.swap(
      user.id,
      swapDto.tokenIn,
      swapDto.tokenOut,
      swapDto.amountIn,
      swapDto.minAmountOut,
    );
  }
}
