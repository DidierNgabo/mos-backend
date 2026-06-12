import { Migration } from '@mikro-orm/migrations';

export class Migration20260612113000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table "phq9_screenings" add column "initial_of_participant" varchar(255) null;',
    );
    this.addSql(
      `alter table "phq9_screenings" add column "marital_status" text check ("marital_status" in ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')) null;`,
    );
    this.addSql(
      `alter table "phq9_screenings" add column "education_level" text check ("education_level" in ('NONE', 'PRIMARY', 'SECONDARY', 'TERTIARY')) null;`,
    );
    this.addSql(
      `alter table "phq9_screenings" add column "occupation" text check ("occupation" in ('NONE', 'PRIVATE', 'PUBLIC')) null;`,
    );
    this.addSql(
      `alter table "phq9_screenings" add column "division" text check ("division" in ('I', 'II', 'III', 'IV')) null;`,
    );
    this.addSql(
      `alter table "phq9_screenings" add column "location_type" text check ("location_type" in ('URBAN', 'RURAL_SEMI_URBAN')) null;`,
    );
    this.addSql(
      `alter table "phq9_screenings" add column "religion" text check ("religion" in ('CATHOLIC', 'PROTESTANT', 'MUSLIM', 'TRADITIONAL', 'OTHER')) null;`,
    );

    this.addSql(`
      with matches as (
        select distinct on (phq."id")
          phq."id" as "phq_id",
          pcl."initial_of_participant",
          pcl."marital_status",
          pcl."education_level",
          pcl."occupation",
          pcl."division",
          pcl."location_type",
          pcl."religion"
        from "phq9_screenings" as phq
        join "pcl5_screenings" as pcl
          on pcl."queue_entry_id" = phq."queue_entry_id"
          and pcl."patient_id" = phq."patient_id"
        where abs(extract(epoch from (pcl."created_at" - phq."created_at"))) <= 60
        order by phq."id", abs(extract(epoch from (pcl."created_at" - phq."created_at")))
      )
      update "phq9_screenings" as phq
      set
        "initial_of_participant" = matches."initial_of_participant",
        "marital_status" = matches."marital_status",
        "education_level" = matches."education_level",
        "occupation" = matches."occupation",
        "division" = matches."division",
        "location_type" = matches."location_type",
        "religion" = matches."religion"
      from matches
      where matches."phq_id" = phq."id";
    `);
  }

  override async down(): Promise<void> {
    this.addSql('alter table "phq9_screenings" drop column "religion";');
    this.addSql('alter table "phq9_screenings" drop column "location_type";');
    this.addSql('alter table "phq9_screenings" drop column "division";');
    this.addSql('alter table "phq9_screenings" drop column "occupation";');
    this.addSql('alter table "phq9_screenings" drop column "education_level";');
    this.addSql('alter table "phq9_screenings" drop column "marital_status";');
    this.addSql(
      'alter table "phq9_screenings" drop column "initial_of_participant";',
    );
  }
}
