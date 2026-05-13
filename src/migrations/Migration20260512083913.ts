import { Migration } from '@mikro-orm/migrations';

export class Migration20260512083913 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "pharmacy_stock" ("id" uuid not null, "outreach_id" uuid not null, "medication_name" varchar(255) not null, "generic_name" varchar(255) not null, "dosage_form" varchar(255) not null, "strength" varchar(255) not null, "quantity_in_stock" int not null default 0, "low_stock_threshold" int not null default 10, "unit_of_measure" varchar(255) not null, "category" varchar(255) null, "manufacturer" varchar(255) null, "batch_number" varchar(255) null, "expiry_date" date null, "is_active" boolean not null default true, "last_updated_by_id" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "pharmacy_stock_pkey" primary key ("id"));`);

    this.addSql(`create table "stock_transactions" ("id" uuid not null, "pharmacy_stock_id" uuid not null, "outreach_id" uuid not null, "transaction_type" text check ("transaction_type" in ('RESTOCK', 'DISPENSE', 'ADJUSTMENT', 'EXPIRY_REMOVAL', 'RETURN')) not null, "quantity" int not null, "quantity_before" int not null, "quantity_after" int not null, "notes" text null, "performed_by_id" uuid not null, "created_at" timestamptz not null, constraint "stock_transactions_pkey" primary key ("id"));`);

    this.addSql(`alter table "pharmacy_stock" add constraint "pharmacy_stock_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "pharmacy_stock" add constraint "pharmacy_stock_last_updated_by_id_foreign" foreign key ("last_updated_by_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "stock_transactions" add constraint "stock_transactions_pharmacy_stock_id_foreign" foreign key ("pharmacy_stock_id") references "pharmacy_stock" ("id") on update cascade;`);
    this.addSql(`alter table "stock_transactions" add constraint "stock_transactions_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "stock_transactions" add constraint "stock_transactions_performed_by_id_foreign" foreign key ("performed_by_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "stock_transactions" drop constraint "stock_transactions_pharmacy_stock_id_foreign";`);

    this.addSql(`drop table if exists "pharmacy_stock" cascade;`);

    this.addSql(`drop table if exists "stock_transactions" cascade;`);
  }

}
