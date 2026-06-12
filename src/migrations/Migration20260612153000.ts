import { Migration } from '@mikro-orm/migrations';

export class Migration20260612153000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      insert into "roles" (
        "id", "name", "description", "is_default", "is_active",
        "is_deleted", "created_at", "updated_at"
      )
      select
        '7d79d665-b50b-4d56-aa35-69f60bc16fa9',
        'PSYCHOLOGIST',
        'Mental health clinician with full screening access',
        true,
        true,
        false,
        current_timestamp,
        current_timestamp
      where not exists (
        select 1 from "roles" where "name" = 'PSYCHOLOGIST'
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      delete from "roles"
      where "name" = 'PSYCHOLOGIST'
        and "id" = '7d79d665-b50b-4d56-aa35-69f60bc16fa9';
    `);
  }
}
