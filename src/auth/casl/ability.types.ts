import { MongoAbility } from '@casl/ability';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

/**
 * String-based subjects avoid MikroORM Proxy detection issues.
 * Use the `subject()` helper from @casl/ability when checking instances:
 *   ability.can(Action.Read, subject('Outreach', outreachEntity))
 */
export type AppSubject =
  | 'Outreach'
  | 'User'
  | 'Role'
  | 'Station'
  | 'Patient'
  | 'VitalSign'
  | 'PharmacyStock'
  | 'QueueEntry'
  | 'StationVisit'
  | 'Observation'
  | 'LabResult'
  | 'CommunicableDisease'
  | 'Transfer'
  | 'Prescription'
  | 'PHQ9Screening'
  | 'GAD7Screening'
  | 'PCL5Screening'
  | 'Team'
  | 'EvangelismRecord'
  | 'all';

export type AppAbility = MongoAbility<[Action, AppSubject]>;
