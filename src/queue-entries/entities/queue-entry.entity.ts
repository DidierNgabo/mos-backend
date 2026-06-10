import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Station } from '../../stations/entities/station.entity';

export enum QueueStatus {
  WAITING = 'WAITING',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum QueuePriority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export enum QueueEntryProjection {
  PATIENT = 'patient',
  OUTREACH = 'outreach',
  CURRENT_STATION = 'currentStation',
}

export const SUMMARY_PROJECTION: QueueEntryProjection[] = [
  QueueEntryProjection.PATIENT,
];

export const DEFAULT_PROJECTION: QueueEntryProjection[] = [
  QueueEntryProjection.PATIENT,
  QueueEntryProjection.OUTREACH,
  QueueEntryProjection.CURRENT_STATION,
];

@Entity({ tableName: 'queue_entries' })
@Index({ properties: ['outreach', 'patient'] })
export class QueueEntry {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @ManyToOne(() => Station, { nullable: true })
  currentStation: Station | null = null;

  @Enum({ items: () => QueueStatus })
  status: QueueStatus = QueueStatus.WAITING;

  @Enum({ items: () => QueuePriority })
  priority: QueuePriority = QueuePriority.NORMAL;

  @Property({ type: 'text', nullable: true })
  chiefComplaint: string | null = null;

  @Property({ type: 'datetime', nullable: true })
  completedAt: Date | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
