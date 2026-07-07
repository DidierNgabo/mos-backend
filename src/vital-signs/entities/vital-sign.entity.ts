import {
  Entity,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';

export enum VitalSignProjection {
  PATIENT = 'patient',
  STATION = 'station',
  RECORDED_BY = 'recordedBy',
  OUTREACH = 'outreach',
}

export const SUMMARY_PROJECTION: VitalSignProjection[] = [
  VitalSignProjection.PATIENT,
];

export const DEFAULT_PROJECTION: VitalSignProjection[] = [
  VitalSignProjection.PATIENT,
  VitalSignProjection.STATION,
  VitalSignProjection.RECORDED_BY,
];

@Entity({ tableName: 'vital_signs' })
export class VitalSign {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Station)
  station: Station;

  @ManyToOne(() => User)
  recordedBy: User;

  // Denormalized from patient for CASL outreach-scoped checks and filtering.
  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @ManyToOne(() => QueueEntry, { nullable: true })
  queueEntry: QueueEntry | null = null;

  @Property({ type: 'int', nullable: true })
  bloodPressureSystolic: number | null = null;

  @Property({ type: 'int', nullable: true })
  bloodPressureDiastolic: number | null = null;

  @Property({ columnType: 'numeric(5,1)', nullable: true })
  pulseRate: number | null = null;

  @Property({ columnType: 'numeric(4,1)' })
  temperature: number;

  @Property({ columnType: 'numeric(5,2)', nullable: true })
  weight: number | null = null;

  @Property({ columnType: 'numeric(5,2)', nullable: true })
  height: number | null = null;

  @Property({ columnType: 'numeric(5,2)', nullable: true })
  bmi: number | null = null;

  @Property({ columnType: 'numeric(4,1)', nullable: true })
  oxygenSaturation?: number | null;

  @Property({ columnType: 'numeric(5,1)', nullable: true })
  bloodGlucose?: number | null;

  @Property({ type: 'text', nullable: true })
  notes?: string | null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
