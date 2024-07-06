import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from '../decorators/auth.decorator';
import { CustomerService } from './customer.service';

@Auth()
@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get(':marketId/:customerBatchIndex')
  buy(
    @Param('marketId') marketId: string,
    @Param('customerBatchIndex') customerBatchIndex: number,
  ) {
    return this.customerService.getCustomerBatch(marketId, customerBatchIndex);
  }
}
