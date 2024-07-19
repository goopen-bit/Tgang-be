import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { UpgradeService } from './upgrade.service';
import { Auth } from '../decorators/auth.decorator';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';
import { BuyUpgradeDto } from './dto/buy-upgrade.dto';

@Auth()
@Controller('upgrades')
export class UpgradeController {
  constructor(private upgradeService: UpgradeService) {}

  @Post('/buy')
  buy(@GetAuthToken() user: AuthTokenData, @Body() body: BuyUpgradeDto) {
    return this.upgradeService.buyUpgrade(user.id, body);
  }

  @Get()
  findAll() {
    return this.upgradeService.findAll();
  }
}
