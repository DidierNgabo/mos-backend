import { Migration } from '@mikro-orm/migrations';

export class Migration20260512095440 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "stations" drop constraint if exists "stations_type_check";`);

    this.addSql(`alter table "stations" add constraint "stations_type_check" check("type" in ('DATA_ENTRY', 'CLINICAL', 'LAB', 'PHARMACY', 'SCREENING', 'RADIOLOGY'));`);

    this.addSql(`alter table "patients" add column "sector" varchar(255) null, add column "cell" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "stations" drop constraint if exists "stations_type_check";`);

    this.addSql(`alter table "patients" drop column "sector", drop column "cell";`);

    this.addSql(`alter table "stations" add constraint "stations_type_check" check("type" in ('CLINICAL', 'LAB', 'PHARMACY', 'SCREENING', 'RADIOLOGY'));`);
  }

}
