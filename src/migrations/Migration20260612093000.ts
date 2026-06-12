import { Migration } from '@mikro-orm/migrations';

export class Migration20260612093000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table "observations" add column "diagnosis_code" varchar(255) null;',
    );
  }

  override async down(): Promise<void> {
    this.addSql('alter table "observations" drop column "diagnosis_code";');
  }
}
