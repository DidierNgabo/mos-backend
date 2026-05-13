import { Migration } from '@mikro-orm/migrations';

export class Migration20260512072123 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "password_reset_token" varchar(255) null, add column "password_reset_expires" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop column "password_reset_token", drop column "password_reset_expires";`);
  }

}
