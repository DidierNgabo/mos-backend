import { Migration } from '@mikro-orm/migrations';

export class Migration20260513083209 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "prescriptions" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "outreach_id" uuid not null, "pharmacy_stock_id" uuid not null, "dosage" varchar(255) not null, "quantity" int not null, "instructions" text null, "status" text check ("status" in ('PENDING', 'DISPENSED', 'CANCELLED')) not null default 'PENDING', "prescribed_by_id" uuid not null, "dispensed_by_id" uuid null, "dispensed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "prescriptions_pkey" primary key ("id"));`);

    this.addSql(`alter table "prescriptions" add constraint "prescriptions_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_pharmacy_stock_id_foreign" foreign key ("pharmacy_stock_id") references "pharmacy_stock" ("id") on update cascade;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_prescribed_by_id_foreign" foreign key ("prescribed_by_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_dispensed_by_id_foreign" foreign key ("dispensed_by_id") references "users" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "prescriptions" cascade;`);
  }

}
