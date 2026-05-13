import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { QueueEntry } from '../../queue-entries/entities/queue-entry.entity';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';

export enum LabTestType {
  HIV = 'HIV',
  HEPATITIS_B = 'HEPATITIS_B',
  HEPATITIS_C = 'HEPATITIS_C',
  MALARIA_RDT = 'MALARIA_RDT',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  HEMOGLOBIN = 'HEMOGLOBIN',
  URINALYSIS = 'URINALYSIS',
  OTHER = 'OTHER',
}

export enum LabResultProjection {
  PATIENT = 'patient',
  STATION = 'station',
  OUTREACH = 'outreach',
  RECORDED_BY = 'recordedBy',
  QUEUE_ENTRY = 'queueEntry',
}

export const SUMMARY_PROJECTION: LabResultProjection[] = [
  LabResultProjection.PATIENT,
];

export const DEFAULT_PROJECTION: LabResultProjection[] = [
  LabResultProjection.PATIENT,
  LabResultProjection.STATION,
  LabResultProjection.RECORDED_BY,
  LabResultProjection.OUTREACH,
];

@Entity({ tableName: 'lab_results' })
export class LabResult {
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

  @Enum({ items: () => LabTestType })
  testType: LabTestType;

  @Property({ type: 'string' })
  resultValue: string;

  @Property({ type: 'string', nullable: true })
  resultUnit: string | null = null;

  @Property({ type: 'boolean', default: false })
  isAbnormal: boolean = false;

  @Property({ type: 'text', nullable: true })
  notes: string | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
