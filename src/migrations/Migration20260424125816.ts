import { Migration } from '@mikro-orm/migrations';

export class Migration20260424125816 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" uuid not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "assigned_station_id" uuid null, "is_active" boolean not null default true, "must_change_password" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "users_roles" ("user_id" uuid not null, "role_id" uuid not null, constraint "users_roles_pkey" primary key ("user_id", "role_id"));`);

    this.addSql(`alter table "users_roles" add constraint "users_roles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "users_roles" add constraint "users_roles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users_roles" drop constraint "users_roles_user_id_foreign";`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "users_roles" cascade;`);
  }

}
