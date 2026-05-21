import { Migration } from '@mikro-orm/migrations';

export class Migration20260521133658 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "communicable_diseases" add column "hiv_screen" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "communicable_diseases" drop column "hiv_screen";`);
  }

}
