import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppAbility } from './ability.types';
import { CaslAbilityFactory } from './casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  IPolicyHandler,
  PolicyHandler,
  PolicyHandlerFn,
} from './check-policies.decorator';

export const ABILITY_KEY = 'ability';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authUser: AuthenticatedUser | undefined = request.user;
    if (!authUser) throw new UnauthorizedException('Authentication required');

    const ability = await this.abilityFactory.createForUser(authUser);

    // Attach ability to the request so controllers/services can use it downstream
    // via the @CurrentAbility() decorator.
    request[ABILITY_KEY] = ability;

    const handlers =
      this.reflector.getAllAndOverride<PolicyHandler[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // No @CheckPolicies on this handler — access is permitted (authentication
    // alone is sufficient for this endpoint).
    if (handlers.length === 0) return true;

    const allowed = handlers.every((h) => this.exec(h, ability));
    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    return true;
  }

  private exec(handler: PolicyHandler, ability: AppAbility): boolean {
    return typeof handler === 'function'
      ? (handler as PolicyHandlerFn)(ability)
      : (handler as IPolicyHandler).handle(ability);
  }
}
