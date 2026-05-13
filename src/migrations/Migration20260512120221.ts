import { Migration } from '@mikro-orm/migrations';

export class Migration20260512120221 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "queue_entries" ("id" uuid not null, "patient_id" uuid not null, "outreach_id" uuid not null, "current_station_id" uuid null, "status" text check ("status" in ('WAITING', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW')) not null default 'WAITING', "priority" text check ("priority" in ('NORMAL', 'URGENT', 'EMERGENCY')) not null default 'NORMAL', "chief_complaint" text null, "completed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "queue_entries_pkey" primary key ("id"));`);

    this.addSql(`create table "transfers" ("id" uuid not null, "queue_entry_id" uuid null, "patient_id" uuid not null, "outreach_id" uuid not null, "initiated_by_id" uuid not null, "transfer_reason" text not null, "referred_to_facility" varchar(255) not null, "referred_service" varchar(255) not null, "urgency" text check ("urgency" in ('ROUTINE', 'URGENT', 'EMERGENCY')) not null default 'ROUTINE', "transport_arranged" boolean not null default false, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "transfers_pkey" primary key ("id"));`);

    this.addSql(`create table "station_visits" ("id" uuid not null, "queue_entry_id" uuid not null, "station_id" uuid not null, "moved_by_id" uuid not null, "arrived_at" timestamptz not null, "departed_at" timestamptz null, "reason" text null, constraint "station_visits_pkey" primary key ("id"));`);

    this.addSql(`create table "observations" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "station_id" uuid not null, "outreach_id" uuid not null, "recorded_by_id" uuid not null, "chief_complaint" text not null, "diagnosis" text not null, "treatment_given" text not null, "follow_up_required" boolean not null default false, "follow_up_notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "observations_pkey" primary key ("id"));`);

    this.addSql(`create table "lab_results" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "station_id" uuid not null, "outreach_id" uuid not null, "recorded_by_id" uuid not null, "test_type" text check ("test_type" in ('HIV', 'HEPATITIS_B', 'HEPATITIS_C', 'MALARIA_RDT', 'BLOOD_GLUCOSE', 'HEMOGLOBIN', 'URINALYSIS', 'OTHER')) not null, "result_value" varchar(255) not null, "result_unit" varchar(255) null, "is_abnormal" boolean not null default false, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "lab_results_pkey" primary key ("id"));`);

    this.addSql(`create table "communicable_diseases" ("id" uuid not null, "queue_entry_id" uuid not null, "patient_id" uuid not null, "outreach_id" uuid not null, "recorded_by_id" uuid not null, "tuberculosis_screen" boolean not null default false, "tuberculosis_notes" text null, "malaria_screen" boolean not null default false, "has_fever" boolean not null default false, "fever_duration_days" int null, "recent_travel" boolean not null default false, "contact_with_infected" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "communicable_diseases_pkey" primary key ("id"));`);

    this.addSql(`alter table "queue_entries" add constraint "queue_entries_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "queue_entries" add constraint "queue_entries_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "queue_entries" add constraint "queue_entries_current_station_id_foreign" foreign key ("current_station_id") references "stations" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "transfers" add constraint "transfers_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "transfers" add constraint "transfers_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "transfers" add constraint "transfers_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "transfers" add constraint "transfers_initiated_by_id_foreign" foreign key ("initiated_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "station_visits" add constraint "station_visits_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "station_visits" add constraint "station_visits_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "station_visits" add constraint "station_visits_moved_by_id_foreign" foreign key ("moved_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "observations" add constraint "observations_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "observations" add constraint "observations_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "observations" add constraint "observations_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "observations" add constraint "observations_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "observations" add constraint "observations_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "lab_results" add constraint "lab_results_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "lab_results" add constraint "lab_results_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "lab_results" add constraint "lab_results_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade;`);
    this.addSql(`alter table "lab_results" add constraint "lab_results_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "lab_results" add constraint "lab_results_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "communicable_diseases" add constraint "communicable_diseases_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade;`);
    this.addSql(`alter table "communicable_diseases" add constraint "communicable_diseases_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade;`);
    this.addSql(`alter table "communicable_diseases" add constraint "communicable_diseases_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "communicable_diseases" add constraint "communicable_diseases_recorded_by_id_foreign" foreign key ("recorded_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "vital_signs" add column "queue_entry_id" uuid null;`);
    this.addSql(`alter table "vital_signs" add constraint "vital_signs_queue_entry_id_foreign" foreign key ("queue_entry_id") references "queue_entries" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transfers" drop constraint "transfers_queue_entry_id_foreign";`);

    this.addSql(`alter table "station_visits" drop constraint "station_visits_queue_entry_id_foreign";`);

    this.addSql(`alter table "observations" drop constraint "observations_queue_entry_id_foreign";`);

    this.addSql(`alter table "lab_results" drop constraint "lab_results_queue_entry_id_foreign";`);

    this.addSql(`alter table "communicable_diseases" drop constraint "communicable_diseases_queue_entry_id_foreign";`);

    this.addSql(`alter table "vital_signs" drop constraint "vital_signs_queue_entry_id_foreign";`);

    this.addSql(`drop table if exists "queue_entries" cascade;`);

    this.addSql(`drop table if exists "transfers" cascade;`);

    this.addSql(`drop table if exists "station_visits" cascade;`);

    this.addSql(`drop table if exists "observations" cascade;`);

    this.addSql(`drop table if exists "lab_results" cascade;`);

    this.addSql(`drop table if exists "communicable_diseases" cascade;`);

    this.addSql(`alter table "vital_signs" drop column "queue_entry_id";`);
  }

}
