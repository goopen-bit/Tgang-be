import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [SocialService],
  controllers: [SocialController]
})
export class SocialModule {}
