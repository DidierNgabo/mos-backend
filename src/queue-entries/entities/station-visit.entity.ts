import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../users/entities/user.entity';
import { QueueEntry } from './queue-entry.entity';

@Entity({ tableName: 'station_visits' })
export class StationVisit {
  @Property({ type: 'uuid', primary: true })
  id: string;

  @ManyToOne(() => QueueEntry, { index: true })
  queueEntry: QueueEntry;

  @ManyToOne(() => Station)
  station: Station;

  @ManyToOne(() => User)
  movedBy: User;

  @Property({ type: 'datetime' })
  arrivedAt: Date = new Date();

  @Property({ type: 'datetime', nullable: true })
  departedAt: Date | null = null;

  @Property({ type: 'text', nullable: true })
  reason: string | null = null;
}
