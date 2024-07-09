import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from '../decorators/auth.decorator';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';

@Auth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async login(@GetAuthToken() user: AuthTokenData) {
    return this.userService.findOne(user.id);
  }
}
