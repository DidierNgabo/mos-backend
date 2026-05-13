import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { User } from '../../users/entities/user.entity';

export enum OutreachStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum OutreachProjection {
  MEMBERS = 'members',
  CREATED_BY = 'createdBy',
}

export const SUMMARY_PROJECTION: OutreachProjection[] = [
  OutreachProjection.CREATED_BY,
];

export const DEFAULT_PROJECTION: OutreachProjection[] = [
  OutreachProjection.MEMBERS,
  OutreachProjection.CREATED_BY,
];

@Entity({ tableName: 'outreaches' })
export class Outreach {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string' })
  location: string;

  @Property({ type: 'date' })
  date: Date;

  @Enum({ items: () => OutreachStatus, default: OutreachStatus.PLANNED })
  status: OutreachStatus = OutreachStatus.PLANNED;

  @ManyToOne(() => User)
  createdBy: User;

  @ManyToMany(() => User, (user) => user.outreaches, { owner: true })
  members = new Collection<User>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
