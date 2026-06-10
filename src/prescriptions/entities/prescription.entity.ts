import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { PharmacyStock } from '../../pharmacy-stock/entities/pharmacy-stock.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { User } from '../../users/entities/user.entity';

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
}

export enum PrescriptionProjection {
  QUEUE_ENTRY = 'queueEntry',
  PATIENT = 'patient',
  OUTREACH = 'outreach',
  PHARMACY_STOCK = 'pharmacyStock',
  PRESCRIBED_BY = 'prescribedBy',
  DISPENSED_BY = 'dispensedBy',
}

export const SUMMARY_PROJECTION: PrescriptionProjection[] = [
  PrescriptionProjection.PATIENT,
  PrescriptionProjection.PHARMACY_STOCK,
  PrescriptionProjection.PRESCRIBED_BY,
];

export const DEFAULT_PROJECTION: PrescriptionProjection[] = [
  PrescriptionProjection.QUEUE_ENTRY,
  PrescriptionProjection.PATIENT,
  PrescriptionProjection.OUTREACH,
  PrescriptionProjection.PHARMACY_STOCK,
  PrescriptionProjection.PRESCRIBED_BY,
  PrescriptionProjection.DISPENSED_BY,
];

@Entity({ tableName: 'prescriptions' })
export class Prescription {
  @Property({ type: 'uuid', primary: true })
  id: string = randomUUID();

  @ManyToOne(() => QueueEntry, { index: true })
  queueEntry: QueueEntry;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Outreach, { index: true })
  outreach: Outreach;

  @ManyToOne(() => PharmacyStock)
  pharmacyStock: PharmacyStock;

  @Property({ type: 'string' })
  dosage: string;

  @Property({ type: 'integer' })
  quantity: number;

  @Property({ type: 'text', nullable: true })
  instructions: string | null = null;

  @Enum({ items: () => PrescriptionStatus, default: PrescriptionStatus.PENDING })
  status: PrescriptionStatus = PrescriptionStatus.PENDING;

  @ManyToOne(() => User)
  prescribedBy: User;

  @ManyToOne(() => User, { nullable: true })
  dispensedBy: User | null = null;

  @Property({ nullable: true })
  dispensedAt: Date | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
