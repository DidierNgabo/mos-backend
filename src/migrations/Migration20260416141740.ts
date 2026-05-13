import { Migration } from '@mikro-orm/migrations';

export class Migration20260416141740 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "roles" ("id" uuid not null, "name" varchar(255) not null, "description" varchar(255) not null, "is_default" boolean not null default false, "is_active" boolean not null default false, "is_deleted" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "roles_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "roles" cascade;`);
  }

}
