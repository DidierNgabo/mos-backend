import { Migration } from '@mikro-orm/migrations';

export class Migration20260521084759 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "teams" ("id" uuid not null, "outreach_id" uuid not null, "name" varchar(255) not null, "description" text null, "type" text check ("type" in ('CLINICAL', 'ALLIED_HEALTH', 'SUPPORTING_STAFF', 'STUDENTS')) null, "parent_id" uuid null, "leader_id" uuid null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "teams_pkey" primary key ("id"));`);

    this.addSql(`create table "teams_members" ("team_id" uuid not null, "user_id" uuid not null, constraint "teams_members_pkey" primary key ("team_id", "user_id"));`);

    this.addSql(`alter table "teams" add constraint "teams_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade;`);
    this.addSql(`alter table "teams" add constraint "teams_parent_id_foreign" foreign key ("parent_id") references "teams" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "teams" add constraint "teams_leader_id_foreign" foreign key ("leader_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "teams_members" add constraint "teams_members_team_id_foreign" foreign key ("team_id") references "teams" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "teams_members" add constraint "teams_members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "teams" drop constraint "teams_parent_id_foreign";`);

    this.addSql(`alter table "teams_members" drop constraint "teams_members_team_id_foreign";`);

    this.addSql(`drop table if exists "teams" cascade;`);

    this.addSql(`drop table if exists "teams_members" cascade;`);
  }

}
