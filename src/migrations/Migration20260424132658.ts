import { Migration } from '@mikro-orm/migrations';

export class Migration20260424132658 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "outreaches" ("id" uuid not null, "name" varchar(255) not null, "location" varchar(255) not null, "date" date not null, "status" text check ("status" in ('PLANNED', 'ACTIVE', 'CLOSED')) not null default 'PLANNED', "created_by_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "outreaches_pkey" primary key ("id"));`);

    this.addSql(`create table "outreaches_members" ("outreach_id" uuid not null, "user_id" uuid not null, constraint "outreaches_members_pkey" primary key ("outreach_id", "user_id"));`);

    this.addSql(`alter table "outreaches" add constraint "outreaches_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "outreaches_members" add constraint "outreaches_members_outreach_id_foreign" foreign key ("outreach_id") references "outreaches" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "outreaches_members" add constraint "outreaches_members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "outreaches_members" drop constraint "outreaches_members_outreach_id_foreign";`);

    this.addSql(`drop table if exists "outreaches" cascade;`);

    this.addSql(`drop table if exists "outreaches_members" cascade;`);
  }

}
