import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

export enum EvangelismRecordProjection {
  OUTREACH = 'outreach',
  PATIENT = 'patient',
  DONE_BY = 'doneBy',
}

export const SUMMARY_PROJECTION: EvangelismRecordProjection[] = [
  EvangelismRecordProjection.PATIENT,
  EvangelismRecordProjection.DONE_BY,
];

export const DEFAULT_PROJECTION: EvangelismRecordProjection[] = [
  EvangelismRecordProjection.OUTREACH,
  EvangelismRecordProjection.PATIENT,
  EvangelismRecordProjection.DONE_BY,
];

@Entity({ tableName: 'evangelism_records' })
export class EvangelismRecord {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => Outreach, { index: true })
  outreach: Outreach;

  @ManyToOne(() => Patient, { nullable: true })
  patient: Patient | null = null;

  @Property({ type: 'string' })
  name: string;

  // III.A — "Ese hari ibintu cyangwa indwara wifuza ko Yesu yagukiza?"
  @Property({ type: 'text', nullable: true })
  healingRequest: string | null = null;

  // III.B — "Ese hari ibyaha wumva Yesu yakubabarira?"
  @Property({ type: 'text', nullable: true })
  sinsToConfess: string | null = null;

  // IV.a — Narakijijwe
  @Property({ type: 'boolean', default: false })
  isSaved: boolean = false;

  // IV.b — Nemeye kwakira Yesu nk'Umwami n'Umukiza
  @Property({ type: 'boolean', default: false })
  acceptedJesus: boolean = false;

  // IV.c — Ndifuza gukomeza kwiga Ijambo ry'Imana no gusengerwa
  @Property({ type: 'boolean', default: false })
  continueTheJourney: boolean = false;

  // IV.d — Nifuza ko bankurikira (Follow-up)
  @Property({ type: 'boolean', default: false })
  followUp: boolean = false;

  // IV.e — Ndifashe (undecided)
  @Property({ type: 'boolean', default: false })
  notSure: boolean = false;

  // IV.f — Ntabyo nshaka
  @Property({ type: 'boolean', default: false })
  declined: boolean = false;

  // V — Isengesho (other prayer requests)
  @Property({ type: 'text', nullable: true })
  prayerRequest: string | null = null;

  @ManyToOne(() => User)
  doneBy: User;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
