import {
  Entity,
  Formula,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { User } from '../../users/entities/user.entity';

export enum PharmacyStockProjection {
  OUTREACH = 'outreach',
  LAST_UPDATED_BY = 'lastUpdatedBy',
}
export const SUMMARY_PROJECTION: PharmacyStockProjection[] = [PharmacyStockProjection.OUTREACH];
export const DEFAULT_PROJECTION: PharmacyStockProjection[] = [
  PharmacyStockProjection.OUTREACH,
  PharmacyStockProjection.LAST_UPDATED_BY,
];

@Entity({ tableName: 'pharmacy_stock' })
export class PharmacyStock {
  @Property({ type: 'uuid', primary: true })
  id: string = randomUUID();

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @Property({ type: 'string' })
  medicationName: string;

  @Property({ type: 'string' })
  genericName: string;

  @Property({ type: 'string' })
  dosageForm: string;

  @Property({ type: 'string' })
  strength: string;

  @Property({ type: 'integer', default: 0 })
  quantityInStock: number = 0;

  @Property({ type: 'integer', default: 10 })
  lowStockThreshold: number = 10;

  @Property({ type: 'string' })
  unitOfMeasure: string;

  @Property({ type: 'string', nullable: true })
  category: string | null = null;

  @Property({ type: 'string', nullable: true })
  manufacturer: string | null = null;

  @Property({ type: 'string', nullable: true })
  batchNumber: string | null = null;

  @Property({ type: 'date', nullable: true })
  expiryDate: Date | null = null;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Formula(
    (alias) =>
      `${alias}.quantity_in_stock <= ${alias}.low_stock_threshold`,
  )
  isLowStock: boolean;

  @ManyToOne(() => User, { nullable: true })
  lastUpdatedBy: User | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
