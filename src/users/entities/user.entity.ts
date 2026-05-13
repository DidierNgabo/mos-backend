import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { Role } from '../../roles/entities/role.entity';
import { Station } from '../../stations/entities/station.entity';

export enum UserProjection {
  ROLES = 'roles',
  STATION = 'station',
  OUTREACHES = 'outreaches',
}

export const SUMMARY_PROJECTION: UserProjection[] = [];

export const DEFAULT_PROJECTION: UserProjection[] = [
  UserProjection.ROLES,
  UserProjection.STATION,
  UserProjection.OUTREACHES,
];

@Entity({ tableName: 'users' })
export class User {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @Property({ type: 'string' })
  firstName: string;

  @Property({ type: 'string' })
  lastName: string;

  @Property({ type: 'string', unique: true })
  email: string;

  @Property({ type: 'string', hidden: true })
  passwordHash: string;

  @ManyToMany(() => Role, undefined, { owner: true })
  roles = new Collection<Role>(this);

  @ManyToMany(() => Outreach, (outreach) => outreach.members)
  outreaches = new Collection<Outreach>(this);

  @ManyToOne(() => Station, { nullable: true })
  station?: Station | null;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Property({ type: 'boolean', default: true })
  mustChangePassword: boolean = true;

  @Property({ type: 'string', nullable: true })
  passwordResetToken: string | null = null;

  @Property({ type: 'datetime', nullable: true })
  passwordResetExpires: Date | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
