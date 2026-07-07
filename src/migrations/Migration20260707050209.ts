import { Migration } from '@mikro-orm/migrations';

export class Migration20260707050209 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "prescriptions" drop constraint "prescriptions_pharmacy_stock_id_foreign";`);

    this.addSql(`drop index "teams_station_id_index";`);

    this.addSql(`alter table "prescriptions" add column "custom_medication_name" varchar(255) null;`);
    this.addSql(`alter table "prescriptions" alter column "pharmacy_stock_id" drop default;`);
    this.addSql(`alter table "prescriptions" alter column "pharmacy_stock_id" type uuid using ("pharmacy_stock_id"::text::uuid);`);
    this.addSql(`alter table "prescriptions" alter column "pharmacy_stock_id" drop not null;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_pharmacy_stock_id_foreign" foreign key ("pharmacy_stock_id") references "pharmacy_stock" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "prescriptions" drop constraint "prescriptions_pharmacy_stock_id_foreign";`);

    this.addSql(`alter table "prescriptions" drop column "custom_medication_name";`);

    this.addSql(`alter table "prescriptions" alter column "pharmacy_stock_id" drop default;`);
    this.addSql(`alter table "prescriptions" alter column "pharmacy_stock_id" type uuid using ("pharmacy_stock_id"::text::uuid);`);
    this.addSql(`alter table "prescriptions" alter column "pharmacy_stock_id" set not null;`);
    this.addSql(`alter table "prescriptions" add constraint "prescriptions_pharmacy_stock_id_foreign" foreign key ("pharmacy_stock_id") references "pharmacy_stock" ("id") on update cascade on delete no action;`);

    this.addSql(`create index "teams_station_id_index" on "teams" ("station_id");`);
  }

}
