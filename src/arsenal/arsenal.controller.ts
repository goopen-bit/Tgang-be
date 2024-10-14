import { Controller } from '@nestjs/common';
import { ArsenalService } from './arsenal.service';
import { Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { Auth } from '../decorators/auth.decorator';
import { AuthTokenData } from 'src/config/types';
import { GetAuthToken } from 'src/decorators/get-auth-token.decorator';
import { GearName } from './arsenal.interface';

@Auth()
@Controller('arsenal')
export class ArsenalController {
  constructor(private arsenalService: ArsenalService) {}

  @Get()
  findAll() {
    return this.arsenalService.getGear();
  }

  @Post(':gearName')
  buyGear(
    @GetAuthToken() user: AuthTokenData,
    @Param('gearName') gearName: GearName,
  ) {
    return this.arsenalService.buyGear(user.id, gearName);
  }

  @Put(':gearName')
  equipGear(
    @GetAuthToken() user: AuthTokenData,
    @Param('gearName') gearName: GearName,
  ) {
    return this.arsenalService.equipGear(user.id, gearName);
  }

  @Delete(':gearName')
  unequipGear(
    @GetAuthToken() user: AuthTokenData,
    @Param('gearName') gearName: GearName,
  ) {
    return this.arsenalService.unequipGear(user.id, gearName);
  }
}
