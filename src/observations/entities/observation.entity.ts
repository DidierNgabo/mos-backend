import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';

export enum ObservationProjection {
  PATIENT = 'patient',
  STATION = 'station',
  OUTREACH = 'outreach',
  RECORDED_BY = 'recordedBy',
  QUEUE_ENTRY = 'queueEntry',
}

export const SUMMARY_PROJECTION: ObservationProjection[] = [
  ObservationProjection.PATIENT,
];

export const DEFAULT_PROJECTION: ObservationProjection[] = [
  ObservationProjection.PATIENT,
  ObservationProjection.STATION,
  ObservationProjection.RECORDED_BY,
  ObservationProjection.OUTREACH,
];

@Entity({ tableName: 'observations' })
export class Observation {
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

  @Property({ type: 'text' })
  chiefComplaint: string;

  @Property({ type: 'text' })
  diagnosis: string;

  @Property({ type: 'string', nullable: true })
  diagnosisCode: string | null = null;

  @Property({ type: 'text', nullable: true })
  treatmentGiven: string | null = null;

  @Property({ type: 'boolean', default: false })
  followUpRequired: boolean = false;

  @Property({ type: 'text', nullable: true })
  followUpNotes: string | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
