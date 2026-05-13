import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';

export enum GAD7Severity {
  MINIMAL = 'MINIMAL',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export enum GAD7Projection {}
export const SUMMARY_PROJECTION: GAD7Projection[] = [];
export const DEFAULT_PROJECTION: GAD7Projection[] = [];

@Entity({ tableName: 'gad7_screenings' })
export class GAD7Screening {
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

  @Property({ type: 'int' })
  q1Anxious: number;

  @Property({ type: 'int' })
  q2Uncontrollable: number;

  @Property({ type: 'int' })
  q3Worrying: number;

  @Property({ type: 'int' })
  q4Relaxing: number;

  @Property({ type: 'int' })
  q5Restless: number;

  @Property({ type: 'int' })
  q6Irritable: number;

  @Property({ type: 'int' })
  q7Afraid: number;

  @Property({ type: 'int' })
  totalScore: number;

  @Enum({ items: () => GAD7Severity })
  severity: GAD7Severity;

  @Property({ type: 'text', nullable: true })
  notes: string | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
