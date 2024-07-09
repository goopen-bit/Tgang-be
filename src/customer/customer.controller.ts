import { Controller, Get, Param } from "@nestjs/common";
import { Auth } from "../decorators/auth.decorator";
import { CustomerService } from "./customer.service";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";

@Auth()
@Controller("customers")
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get(":marketId/:customerBatchIndex")
  buy(
    @GetAuthToken() user: AuthTokenData,
    @Param("marketId") marketId: string,
    @Param("customerBatchIndex") customerBatchIndex: number
  ) {
    return this.customerService.getCustomerBatch(
      marketId,
      customerBatchIndex,
      user.id
    );
  }
}
