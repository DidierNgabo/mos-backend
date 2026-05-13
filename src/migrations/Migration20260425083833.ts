import { Migration } from '@mikro-orm/migrations';

export class Migration20260425083833 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "stations" ("id" uuid not null, "outreach_id" uuid not null, "name" varchar(255) not null, "type" text check ("type" in ('CLINICAL', 'LAB', 'PHARMACY', 'SCREENING', 'RADIOLOGY')) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "stations_pkey" primary key ("id"));`);

    this.addSql(`alter table "stations" add constraint "stations_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);

    this.addSql(`alter table "users" drop column "assigned_station_id";`);

    this.addSql(`alter table "users" add column "station_id" uuid null;`);
    this.addSql(`alter table "users" add constraint "users_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_station_id_foreign";`);

    this.addSql(`drop table if exists "stations" cascade;`);

    this.addSql(`alter table "users" drop column "station_id";`);

    this.addSql(`alter table "users" add column "assigned_station_id" uuid null;`);
  }

}
