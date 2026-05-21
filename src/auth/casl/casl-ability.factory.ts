import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { AuthenticatedUser } from '../auth.types';
import { Action, AppAbility } from './ability.types';

/**
 * Role names mirrored from the seeded roles so guards and factory stay in sync.
 * If you rename a role in the DB, update this enum.
 */
export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OUTREACH_ADMIN = 'OUTREACH_ADMIN',
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR',
  DATA_CLERK = 'DATA_CLERK',
  PHARMACIST = 'PHARMACIST',
}

const CLINICAL_ROLES: string[] = [
  RoleName.NURSE,
  RoleName.DOCTOR,
  RoleName.DATA_CLERK,
  RoleName.PHARMACIST,
];

const READ_ONLY_CLINICAL_ROLES: string[] = [
  RoleName.NURSE,
  RoleName.DOCTOR,
  RoleName.PHARMACIST,
];

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async createForUser(authUser: AuthenticatedUser): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Load fresh outreach memberships — not stored in JWT so they reflect current DB state.
    const user = await this.userRepository.findOne(
      { id: authUser.id },
      { populate: ['outreaches'] },
    );
    const outreachIds: string[] =
      user?.outreaches.getItems().map((o) => o.id) ?? [];

    if (authUser.roles.includes(RoleName.SUPER_ADMIN)) {
      // Full access — return early, no further rules needed.
      can(Action.Manage, 'all');
      return build();
    }

    if (authUser.roles.includes(RoleName.OUTREACH_ADMIN)) {
      // Manage all outreaches and their membership.
      can(Action.Manage, 'Outreach');
      // Manage stations within outreaches.
      can(Action.Manage, 'Station');
      // Manage users (invite, update, deactivate) — but not delete arbitrarily.
      can(Action.Create, 'User');
      can(Action.Read, 'User');
      can(Action.Update, 'User');
      // Read role definitions (needed for invite forms).
      can(Action.Read, 'Role');
      // Manage patients within their outreaches.
      can(Action.Manage, 'Patient', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      // Manage vital signs within their outreaches.
      can(Action.Manage, 'VitalSign', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      // Manage pharmacy stock within their outreaches.
      can(Action.Manage, 'PharmacyStock', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      // Manage queue and clinical records within their outreaches.
      can(Action.Manage, 'QueueEntry', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'StationVisit');
      can(Action.Manage, 'Observation', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'LabResult', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'CommunicableDisease', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'Transfer', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'Prescription', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'PHQ9Screening', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'GAD7Screening', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'PCL5Screening', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Manage, 'Team');
    }

    // String subjects don't carry entity shapes, so conditions must be cast.
    // The conditions are evaluated correctly at runtime by CASL's mongo query engine.
    if (authUser.roles.some((r) => CLINICAL_ROLES.includes(r))) {
      can(Action.Read, 'Outreach', { id: { $in: outreachIds } } as any);
      can(Action.Read, 'User', {
        'outreaches.id': { $in: outreachIds },
      } as any);
      can(Action.Read, 'Station');
      can(Action.Read, 'Team');
    }

    // PHARMACIST can manage pharmacy stock in their outreaches.
    if (authUser.roles.includes(RoleName.PHARMACIST)) {
      can([Action.Create, Action.Read, Action.Update], 'PharmacyStock', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    // DATA_CLERK can register and read patients in their outreaches.
    if (authUser.roles.includes(RoleName.DATA_CLERK)) {
      can(Action.Create, 'Patient');
      can(Action.Read, 'Patient');
      can(Action.Update, 'Patient');
      // DATA_CLERK creates the initial queue entry when registering a patient.
      can(Action.Create, 'QueueEntry', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Read, 'QueueEntry', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    // Other clinical roles (NURSE, DOCTOR, PHARMACIST) can only read patients.
    if (authUser.roles.some((r) => READ_ONLY_CLINICAL_ROLES.includes(r))) {
      can(Action.Read, 'Patient', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      // NURSE and DOCTOR can read pharmacy stock to know what's available.
      can(Action.Read, 'PharmacyStock', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    // NURSE and DOCTOR can record and read vital signs in their outreaches.
    if (
      authUser.roles.includes(RoleName.NURSE) ||
      authUser.roles.includes(RoleName.DOCTOR)
    ) {
      can(Action.Create, 'VitalSign');
      can([Action.Read, Action.Update], 'VitalSign', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      // Nurses and doctors manage the queue and can move patients between stations.
      can([Action.Read, Action.Update], 'QueueEntry', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Create, 'StationVisit');
      can([Action.Create, Action.Read, Action.Update], 'CommunicableDisease', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can([Action.Create, Action.Read, Action.Update], 'Observation', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can([Action.Create, Action.Read, Action.Update], 'PHQ9Screening', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can([Action.Create, Action.Read, Action.Update], 'GAD7Screening', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can([Action.Create, Action.Read, Action.Update], 'PCL5Screening', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    // DOCTOR additionally handles lab results, external transfers, and prescriptions.
    if (authUser.roles.includes(RoleName.DOCTOR)) {
      can([Action.Create, Action.Read, Action.Update], 'LabResult', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can([Action.Create, Action.Read, Action.Update], 'Transfer', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can([Action.Create, Action.Read], 'Prescription', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    // PHARMACIST can see and manage the queue at their station, dispense and prescribe medications.
    if (authUser.roles.includes(RoleName.PHARMACIST)) {
      can([Action.Read, Action.Update], 'QueueEntry', {
        outreach: { id: { $in: outreachIds } },
      } as any);
      can(Action.Create, 'StationVisit');
      can([Action.Create, Action.Read, Action.Update], 'Prescription', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    // NURSE can read prescriptions to stay informed of patient treatment.
    if (authUser.roles.includes(RoleName.NURSE)) {
      can(Action.Read, 'Prescription', {
        outreach: { id: { $in: outreachIds } },
      } as any);
    }

    can(Action.Read, 'User', { id: authUser.id } as any);
    can(Action.Update, 'User', { id: authUser.id } as any);

    return build();
  }
}
