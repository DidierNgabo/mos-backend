import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { User } from '../../users/entities/user.entity';

export enum TeamType {
  CLINICAL = 'CLINICAL',
  ALLIED_HEALTH = 'ALLIED_HEALTH',
  SUPPORTING_STAFF = 'SUPPORTING_STAFF',
  STUDENTS = 'STUDENTS',
}

export const DEFAULT_TEAM_HIERARCHY: {
  name: string;
  type: TeamType;
  children: string[];
}[] = [
  {
    name: 'Clinical Team',
    type: TeamType.CLINICAL,
    children: [
      'General Practitioners',
      'Gynecology & Obstetrics',
      'Mental Health',
      'Pediatricians',
      'Oncologist',
      'Other Specialties',
    ],
  },
  {
    name: 'Allied Health Professionals',
    type: TeamType.ALLIED_HEALTH,
    children: [
      'Laboratory & Radiology Technicians',
      'Pharmacists',
      'Dentistry & Ophthalmology',
      'Nutrition',
      'Others',
    ],
  },
  {
    name: 'Supporting Staff/Team',
    type: TeamType.SUPPORTING_STAFF,
    children: [
      'Triage & Data Entry',
      'Community Health Workers',
      'Protocols and Services',
    ],
  },
  {
    name: 'Students Team',
    type: TeamType.STUDENTS,
    children: [
      'Healthcare Students (CMHS)',
      'Non-Healthcare Students (non-CMHS)',
    ],
  },
];

export enum TeamProjection {
  OUTREACH = 'outreach',
  PARENT = 'parent',
  CHILDREN = 'children',
  LEADER = 'leader',
  MEMBERS = 'members',
}

export const SUMMARY_PROJECTION: TeamProjection[] = [TeamProjection.LEADER];

export const DEFAULT_PROJECTION: TeamProjection[] = [
  TeamProjection.OUTREACH,
  TeamProjection.PARENT,
  TeamProjection.CHILDREN,
  TeamProjection.LEADER,
  TeamProjection.MEMBERS,
];

@Entity({ tableName: 'teams' })
export class Team {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'text', nullable: true })
  description: string | null = null;

  @Enum({ items: () => TeamType, nullable: true })
  type: TeamType | null = null;

  @ManyToOne(() => Team, { nullable: true })
  parent: Team | null = null;

  @OneToMany(() => Team, (t) => t.parent)
  children = new Collection<Team>(this);

  @ManyToOne(() => User, { nullable: true })
  leader: User | null = null;

  @ManyToMany(() => User, undefined, { owner: true })
  members = new Collection<User>(this);

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
