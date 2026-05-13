import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { Outreach } from '../../outreaches/entities/outreach.entity';
import { User } from '../../users/entities/user.entity';
import { PharmacyStock } from './pharmacy-stock.entity';

export enum TransactionType {
  RESTOCK = 'RESTOCK',
  DISPENSE = 'DISPENSE',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRY_REMOVAL = 'EXPIRY_REMOVAL',
  RETURN = 'RETURN',
}

@Entity({ tableName: 'stock_transactions' })
export class StockTransaction {
  @Property({ type: 'uuid', primary: true })
  id: string = randomUUID();

  @ManyToOne(() => PharmacyStock)
  pharmacyStock: PharmacyStock;

  @ManyToOne(() => Outreach)
  outreach: Outreach;

  @Enum({ items: () => TransactionType })
  transactionType: TransactionType;

  @Property({ type: 'integer' })
  quantity: number;

  @Property({ type: 'integer' })
  quantityBefore: number;

  @Property({ type: 'integer' })
  quantityAfter: number;

  @Property({ type: 'text', nullable: true })
  notes: string | null = null;

  @ManyToOne(() => User)
  performedBy: User;

  @Property()
  createdAt: Date = new Date();
}
