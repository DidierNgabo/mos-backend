import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { User } from '../../users/entities/user.entity';

export enum TransferUrgency {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export enum TransferProjection {
  PATIENT = 'patient',
  OUTREACH = 'outreach',
  INITIATED_BY = 'initiatedBy',
  QUEUE_ENTRY = 'queueEntry',
}

export const SUMMARY_PROJECTION: TransferProjection[] = [
  TransferProjection.PATIENT,
];

export const DEFAULT_PROJECTION: TransferProjection[] = [
  TransferProjection.PATIENT,
  TransferProjection.INITIATED_BY,
  TransferProjection.OUTREACH,
];

@Entity({ tableName: 'transfers' })
export class Transfer {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => QueueEntry, { nullable: true })
  queueEntry: QueueEntry | null = null;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @ManyToOne(() => User)
  initiatedBy: User;

  @Property({ type: 'text' })
  transferReason: string;

  @Property({ type: 'string' })
  referredToFacility: string;

  @Property({ type: 'string' })
  referredService: string;

  @Enum({ items: () => TransferUrgency })
  urgency: TransferUrgency = TransferUrgency.ROUTINE;

  @Property({ type: 'boolean', default: false })
  transportArranged: boolean = false;

  @Property({ type: 'text', nullable: true })
  notes: string | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
