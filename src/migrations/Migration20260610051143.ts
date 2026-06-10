import { Migration } from '@mikro-orm/migrations';

export class Migration20260610051143 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "evangelism_records" ("id" uuid not null, "outreach_id" uuid not null, "patient_id" uuid null, "name" varchar(255) not null, "healing_request" text null, "sins_to_confess" text null, "is_saved" boolean not null default false, "accepted_jesus" boolean not null default false, "continue_the_journey" boolean not null default false, "follow_up" boolean not null default false, "not_sure" boolean not null default false, "declined" boolean not null default false, "prayer_request" text null, "done_by_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "evangelism_records_pkey" primary key ("id"));`);
    this.addSql(`create index "evangelism_records_outreach_id_index" on "evangelism_records" ("outreach_id");`);

    this.addSql(`alter table "evangelism_records" add constraint "evangelism_records_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "evangelism_records" add constraint "evangelism_records_patient_id_foreign" foreign key ("patient_id") references "patients" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "evangelism_records" add constraint "evangelism_records_done_by_id_foreign" foreign key ("done_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "teams" drop constraint if exists "teams_type_check";`);

    this.addSql(`alter table "teams" add constraint "teams_type_check" check("type" in ('CLINICAL', 'ALLIED_HEALTH', 'SUPPORTING_STAFF', 'STUDENTS', 'EVANGELISM'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "evangelism_records" cascade;`);

    this.addSql(`alter table "teams" drop constraint if exists "teams_type_check";`);

    this.addSql(`alter table "teams" add constraint "teams_type_check" check("type" in ('CLINICAL', 'ALLIED_HEALTH', 'SUPPORTING_STAFF', 'STUDENTS'));`);
  }

}
