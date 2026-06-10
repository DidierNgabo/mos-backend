import {
  Collection,
  Entity,
  Enum,
  Formula,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { User } from '../../users/entities/user.entity';

export enum StationType {
  DATA_ENTRY = 'DATA_ENTRY',
  CLINICAL = 'CLINICAL',
  LAB = 'LAB',
  PHARMACY = 'PHARMACY',
  SCREENING = 'SCREENING',
  RADIOLOGY = 'RADIOLOGY',
}

export const DEFAULT_STATIONS: { name: string; type: StationType }[] = [
  { name: 'Data Entry', type: StationType.DATA_ENTRY },
  { name: 'Pharmacy', type: StationType.PHARMACY },
  { name: 'Laboratory', type: StationType.LAB },
  { name: 'Triage', type: StationType.CLINICAL },
  { name: 'General Practitioner Consultation', type: StationType.CLINICAL },
  { name: 'Gynecology & Obstetrics', type: StationType.CLINICAL },
  { name: 'Pediatrics', type: StationType.CLINICAL },
  { name: 'Mental Health/Social', type: StationType.CLINICAL },
  { name: 'Dentistry', type: StationType.CLINICAL },
  { name: 'Nutrition', type: StationType.SCREENING },
  { name: 'Ophthalmology', type: StationType.SCREENING },
  { name: 'Radiology', type: StationType.RADIOLOGY },
];

export enum StationProjection {
  USERS = 'users',
  OUTREACH = 'outreach',
}

export const SUMMARY_PROJECTION: StationProjection[] = [
  StationProjection.OUTREACH,
];

export const DEFAULT_PROJECTION: StationProjection[] = [
  StationProjection.OUTREACH,
];

@Entity({ tableName: 'stations' })
export class Station {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => Outreach, { index: true })
  outreach: Outreach;

  @Property({ type: 'string' })
  name: string;

  @Enum({ items: () => StationType })
  type: StationType;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Formula(
    (table) =>
      `(SELECT COUNT(*)::int FROM users WHERE station_id = ${table.alias}.id)`,
  )
  userCount: number = 0;

  @OneToMany(() => User, (user) => user.station)
  users = new Collection<User>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
