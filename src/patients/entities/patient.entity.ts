import {
  Entity,
  Enum,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { User } from '../../users/entities/user.entity';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum PatientProjection {
  OUTREACH = 'outreach',
  REGISTERED_BY = 'registeredBy',
}

export const SUMMARY_PROJECTION: PatientProjection[] = [
  PatientProjection.REGISTERED_BY,
];

export const DEFAULT_PROJECTION: PatientProjection[] = [
  PatientProjection.OUTREACH,
  PatientProjection.REGISTERED_BY,
];

@Entity({ tableName: 'patients' })
export class Patient {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @Property({ type: 'string', unique: true })
  registrationNumber: string;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @Property({ type: 'string' })
  firstName: string;

  @Property({ type: 'string' })
  lastName: string;

  @Property({ type: 'date' })
  dateOfBirth: Date;

  @Enum({ items: () => Gender })
  gender: Gender;

  @Property({ type: 'string', nullable: true })
  phoneNumber?: string | null;

  @Property({ type: 'string', nullable: true })
  nationalId?: string | null;

  @Property({ type: 'string' })
  village: string;

  @Property({ type: 'string' })
  district: string;

  @Property({ type: 'string', nullable: true })
  sector: string | null = null;

  @Property({ type: 'string', nullable: true })
  cell: string | null = null;

  @Property({ type: 'string' })
  province: string;

  @ManyToOne(() => User)
  registeredBy: User;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
