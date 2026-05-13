import { Migration } from '@mikro-orm/migrations';

export class Migration20260513104028 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "phq9_screenings" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "station_id" uuid not null, "outreach_id" uuid not null, "recorded_by_id" uuid not null, "q1little_interest" int not null, "q2depressed" int not null, "q3sleep_problems" int not null, "q4fatigue" int not null, "q5appetite" int not null, "q6worthlessness" int not null, "q7concentration" int not null, "q8psychomotor" int not null, "q9self_harm" int not null, "total_score" int not null, "severity" text check ("severity" in ('NONE', 'MILD', 'MODERATE', 'MOD_SEVERE', 'SEVERE')) not null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "phq9_screenings_pkey" primary key ("id"));`);

    this.addSql(`create table "pcl5_screenings" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "station_id" uuid not null, "outreach_id" uuid not null, "recorded_by_id" uuid not null, "initial_of_participant" varchar(255) null, "marital_status" text check ("marital_status" in ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')) null, "education_level" text check ("education_level" in ('NONE', 'PRIMARY', 'SECONDARY', 'TERTIARY')) null, "occupation" text check ("occupation" in ('NONE', 'PRIVATE', 'PUBLIC')) null, "division" text check ("division" in ('I', 'II', 'III', 'IV')) null, "location_type" text check ("location_type" in ('URBAN', 'RURAL_SEMI_URBAN')) null, "religion" text check ("religion" in ('CATHOLIC', 'PROTESTANT', 'MUSLIM', 'TRADITIONAL', 'OTHER')) null, "q1" int not null, "q2" int not null, "q3" int not null, "q4" int not null, "q5" int not null, "q6" int not null, "q7" int not null, "q8" int not null, "q9" int not null, "q10" int not null, "q11" int not null, "q12" int not null, "q13" int not null, "q14" int not null, "q15" int not null, "q16" int not null, "q17" int not null, "q18" int not null, "q19" int not null, "q20" int not null, "total_score" int not null, "severity" text check ("severity" in ('MINIMAL', 'MODERATE', 'SEVERE', 'EXTREME')) not null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "pcl5_screenings_pkey" primary key ("id"));`);

    this.addSql(`create table "gad7_screenings" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "station_id" uuid not null, "outreach_id" uuid not null, "recorded_by_id" uuid not null, "q1anxious" int not null, "q2uncontrollable" int not null, "q3worrying" int not null, "q4relaxing" int not null, "q5restless" int not null, "q6irritable" int not null, "q7afraid" int not null, "total_score" int not null, "severity" text check ("severity" in ('MINIMAL', 'MILD', 'MODERATE', 'SEVERE')) not null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "gad7_screenings_pkey" primary key ("id"));`);

    this.addSql(`alter table "phq9_screenings" add constraint "phq9_screenings_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "phq9_screenings" add constraint "phq9_screenings_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "phq9_screenings" add constraint "phq9_screenings_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "phq9_screenings" add constraint "phq9_screenings_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "phq9_screenings" add constraint "phq9_screenings_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "pcl5_screenings" add constraint "pcl5_screenings_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "pcl5_screenings" add constraint "pcl5_screenings_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "pcl5_screenings" add constraint "pcl5_screenings_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "pcl5_screenings" add constraint "pcl5_screenings_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "pcl5_screenings" add constraint "pcl5_screenings_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "gad7_screenings" add constraint "gad7_screenings_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "gad7_screenings" add constraint "gad7_screenings_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "gad7_screenings" add constraint "gad7_screenings_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "gad7_screenings" add constraint "gad7_screenings_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "gad7_screenings" add constraint "gad7_screenings_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "phq9_screenings" cascade;`);

    this.addSql(`drop table if exists "pcl5_screenings" cascade;`);

    this.addSql(`drop table if exists "gad7_screenings" cascade;`);
  }

}
