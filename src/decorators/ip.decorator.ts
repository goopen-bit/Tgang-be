import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getClientIp } from 'request-ip';

export const Ip = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return getClientIp(req);
  },
);
