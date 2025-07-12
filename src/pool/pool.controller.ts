import { Controller } from '@nestjs/common';
import { PoolService } from './pool.service';
import { Auth } from '../decorators/auth.decorator';

@Auth()
@Controller('pools')
export class PoolController {
  constructor(private poolService: PoolService) {}
}
