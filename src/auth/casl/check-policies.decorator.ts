import { SetMetadata } from '@nestjs/common';
import { AppAbility } from './ability.types';

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandlerFn = (ability: AppAbility) => boolean;
export type PolicyHandler = IPolicyHandler | PolicyHandlerFn;

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
