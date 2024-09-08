import { Module } from '@nestjs/common';
import { MultiplayerController } from './multiplayer.controller';
import { MultiplayerService } from './multiplayer.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [MultiplayerController],
  providers: [MultiplayerService],
})
export class MultiplayerModule {}