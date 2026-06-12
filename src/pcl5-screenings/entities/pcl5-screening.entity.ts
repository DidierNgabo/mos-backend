import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum EducationLevel {
  NONE = 'NONE',
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
}

export enum OccupationType {
  NONE = 'NONE',
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export enum DivisionType {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
}

export enum LocationType {
  URBAN = 'URBAN',
  RURAL_SEMI_URBAN = 'RURAL_SEMI_URBAN',
}

export enum ReligionType {
  CATHOLIC = 'CATHOLIC',
  PROTESTANT = 'PROTESTANT',
  MUSLIM = 'MUSLIM',
  TRADITIONAL = 'TRADITIONAL',
  OTHER = 'OTHER',
}

export enum PCL5Severity {
  MINIMAL = 'MINIMAL',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  EXTREME = 'EXTREME',
}

export enum PCL5Projection {}
export const SUMMARY_PROJECTION: PCL5Projection[] = [];
export const DEFAULT_PROJECTION: PCL5Projection[] = [];

@Entity({ tableName: 'pcl5_screenings' })
export class PCL5Screening {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => QueueEntry)
  queueEntry: QueueEntry;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Station)
  station: Station;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @ManyToOne(() => User)
  recordedBy: User;

  // Legacy demographic copy retained for compatibility with existing PCL-5 data.
  @Property({ type: 'string', nullable: true })
  initialOfParticipant: string | null = null;

  @Enum({ items: () => MaritalStatus, nullable: true })
  maritalStatus: MaritalStatus | null = null;

  @Enum({ items: () => EducationLevel, nullable: true })
  educationLevel: EducationLevel | null = null;

  @Enum({ items: () => OccupationType, nullable: true })
  occupation: OccupationType | null = null;

  @Enum({ items: () => DivisionType, nullable: true })
  division: DivisionType | null = null;

  @Enum({ items: () => LocationType, nullable: true })
  locationType: LocationType | null = null;

  @Enum({ items: () => ReligionType, nullable: true })
  religion: ReligionType | null = null;

  // PCL-5 questions (0–4 each)
  @Property({ type: 'int' })
  q1: number;

  @Property({ type: 'int' })
  q2: number;

  @Property({ type: 'int' })
  q3: number;

  @Property({ type: 'int' })
  q4: number;

  @Property({ type: 'int' })
  q5: number;

  @Property({ type: 'int' })
  q6: number;

  @Property({ type: 'int' })
  q7: number;

  @Property({ type: 'int' })
  q8: number;

  @Property({ type: 'int' })
  q9: number;

  @Property({ type: 'int' })
  q10: number;

  @Property({ type: 'int' })
  q11: number;

  @Property({ type: 'int' })
  q12: number;

  @Property({ type: 'int' })
  q13: number;

  @Property({ type: 'int' })
  q14: number;

  @Property({ type: 'int' })
  q15: number;

  @Property({ type: 'int' })
  q16: number;

  @Property({ type: 'int' })
  q17: number;

  @Property({ type: 'int' })
  q18: number;

  @Property({ type: 'int' })
  q19: number;

  @Property({ type: 'int' })
  q20: number;

  @Property({ type: 'int' })
  totalScore: number;

  @Enum({ items: () => PCL5Severity })
  severity: PCL5Severity;

  @Property({ type: 'text', nullable: true })
  notes: string | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
