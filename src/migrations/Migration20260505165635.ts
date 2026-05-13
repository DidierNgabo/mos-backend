import { Migration } from '@mikro-orm/migrations';

export class Migration20260505165635 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "vital_signs" ("id" uuid not null, "patient_id" uuid not null, "station_id" uuid not null, "recorded_by_id" uuid not null, "outreach_id" uuid not null, "blood_pressure_systolic" int not null, "blood_pressure_diastolic" int not null, "pulse_rate" numeric(5,1) not null, "temperature" numeric(4,1) not null, "weight" numeric(5,2) not null, "height" numeric(5,2) not null, "bmi" numeric(5,2) not null, "oxygen_saturation" numeric(4,1) null, "blood_glucose" numeric(5,1) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "vital_signs_pkey" primary key ("id"));`);

    this.addSql(`alter table "vital_signs" add constraint "vital_signs_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "vital_signs" add constraint "vital_signs_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "vital_signs" add constraint "vital_signs_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "vital_signs" add constraint "vital_signs_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vital_signs" cascade;`);
  }

}
