import { Migration } from '@mikro-orm/migrations';

export class Migration20260429175344 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "patients" ("id" uuid not null, "registration_number" varchar(255) not null, "outreach_id" uuid not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "date_of_birth" date not null, "gender" text check ("gender" in ('MALE', 'FEMALE')) not null, "phone_number" varchar(255) null, "national_id" varchar(255) null, "village" varchar(255) not null, "district" varchar(255) not null, "province" varchar(255) not null, "registered_by_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "patients_pkey" primary key ("id"));`);
    this.addSql(`alter table "patients" add constraint "patients_registration_number_unique" unique ("registration_number");`);

    this.addSql(`alter table "patients" add constraint "patients_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "patients" add constraint "patients_registered_by_id_foreign" foreign key ("registered_by_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "patients" cascade;`);
  }

}
