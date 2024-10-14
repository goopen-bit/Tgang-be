import { Module } from '@nestjs/common';
import { ArsenalService } from './arsenal.service';
import { ArsenalController } from './arsenal.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [ArsenalService],
  controllers: [ArsenalController]
})
export class ArsenalModule {}
