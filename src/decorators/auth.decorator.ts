import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export function Auth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
