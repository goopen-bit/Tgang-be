import { Controller, Get, Param, Post, Put } from '@nestjs/common';
import { SocialService } from './social.service';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';
import { SocialChannel } from './social.const';
import { Auth } from '../decorators/auth.decorator';

@Auth()
@Controller('socials')
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Get()
  getSocials() {
    return this.socialService.getSocials();
  }

  @Put("/join/:channel")
  joinChannel(
    @GetAuthToken() user: AuthTokenData,
    @Param("channel") channel: SocialChannel,
  ) {
    return this.socialService.join(user.id, channel);
  }

  @Put("/verify/:channel")
  verifyChannelMember(
    @GetAuthToken() user: AuthTokenData,
    @Param("channel") channel: SocialChannel,
  ) {
    return this.socialService.verify(user.id, channel);
  }
}
