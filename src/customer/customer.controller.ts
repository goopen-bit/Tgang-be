import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from '../decorators/auth.decorator';
import { CustomerService } from './customer.service';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';

@Auth()
@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get(':marketId')
  buy(
    @Param('marketId') marketId: string,
    @GetAuthToken() user: AuthTokenData,
  ) {
    return this.customerService.findOneOrCreate(user.id, marketId);
  }
}
