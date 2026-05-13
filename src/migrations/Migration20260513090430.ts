import { Migration } from '@mikro-orm/migrations';

export class Migration20260513090430 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "observations" alter column "treatment_given" type text using ("treatment_given"::text);`);
    this.addSql(`alter table "observations" alter column "treatment_given" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "observations" alter column "treatment_given" type text using ("treatment_given"::text);`);
    this.addSql(`alter table "observations" alter column "treatment_given" set not null;`);
  }

}
