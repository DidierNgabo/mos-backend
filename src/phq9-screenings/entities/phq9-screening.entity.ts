import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';
import {
  DivisionType,
  EducationLevel,
  LocationType,
  MaritalStatus,
  OccupationType,
  ReligionType,
} from '../../pcl5-screenings/entities/pcl5-screening.entity';

export enum PHQ9Severity {
  NONE = 'NONE',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  MOD_SEVERE = 'MOD_SEVERE',
  SEVERE = 'SEVERE',
}

export enum PHQ9Projection {}
export const SUMMARY_PROJECTION: PHQ9Projection[] = [];
export const DEFAULT_PROJECTION: PHQ9Projection[] = [];

@Entity({ tableName: 'phq9_screenings' })
export class PHQ9Screening {
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

  @Property({ type: 'int' })
  q1LittleInterest: number;

  @Property({ type: 'int' })
  q2Depressed: number;

  @Property({ type: 'int' })
  q3SleepProblems: number;

  @Property({ type: 'int' })
  q4Fatigue: number;

  @Property({ type: 'int' })
  q5Appetite: number;

  @Property({ type: 'int' })
  q6Worthlessness: number;

  @Property({ type: 'int' })
  q7Concentration: number;

  @Property({ type: 'int' })
  q8Psychomotor: number;

  @Property({ type: 'int' })
  q9SelfHarm: number;

  @Property({ type: 'int' })
  totalScore: number;

  @Enum({ items: () => PHQ9Severity })
  severity: PHQ9Severity;

  @Property({ type: 'text', nullable: true })
  notes: string | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
