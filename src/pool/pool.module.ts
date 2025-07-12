import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { PoolService } from './pool.service';
import { PoolController } from './pool.controller';
import { Pool, PoolSchema } from './schemas/pool.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pool.name, schema: PoolSchema }]),
    UserModule,
  ],
  providers: [PoolService],
  exports: [PoolService],
  controllers: [PoolController],
})
export class PoolModule {}
