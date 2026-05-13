import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AppAbility } from '../casl/ability.types';
import { ABILITY_KEY } from '../casl/policies.guard';

export const CurrentAbility = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppAbility => {
    return ctx.switchToHttp().getRequest()[ABILITY_KEY];
  },
);
