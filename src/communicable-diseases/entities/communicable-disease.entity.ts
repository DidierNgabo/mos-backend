import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { User } from '../../users/entities/user.entity';

export enum CommunicableDiseaseProjection {
  PATIENT = 'patient',
  OUTREACH = 'outreach',
  RECORDED_BY = 'recordedBy',
  QUEUE_ENTRY = 'queueEntry',
}

export const SUMMARY_PROJECTION: CommunicableDiseaseProjection[] = [
  CommunicableDiseaseProjection.PATIENT,
];

export const DEFAULT_PROJECTION: CommunicableDiseaseProjection[] = [
  CommunicableDiseaseProjection.PATIENT,
  CommunicableDiseaseProjection.RECORDED_BY,
  CommunicableDiseaseProjection.OUTREACH,
];

@Entity({ tableName: 'communicable_diseases' })
export class CommunicableDisease {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => QueueEntry)
  queueEntry: QueueEntry;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @ManyToOne(() => User)
  recordedBy: User;

  @Property({ type: 'boolean', default: false })
  tuberculosisScreen: boolean = false;

  @Property({ type: 'text', nullable: true })
  tuberculosisNotes: string | null = null;

  @Property({ type: 'boolean', default: false })
  malariaScreen: boolean = false;

  @Property({ type: 'boolean', default: false })
  hasFever: boolean = false;

  @Property({ type: 'int', nullable: true })
  feverDurationDays: number | null = null;

  @Property({ type: 'boolean', default: false })
  recentTravel: boolean = false;

  @Property({ type: 'boolean', default: false })
  contactWithInfected: boolean = false;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
