import { Migration } from '@mikro-orm/migrations';

export class Migration20260602000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE SEQUENCE IF NOT EXISTS patient_reg_num_seq;`);

    this.addSql(`
      SELECT setval(
        'patient_reg_num_seq',
        COALESCE(
          (SELECT MAX(CAST(SPLIT_PART(registration_number, '-', 3) AS INTEGER)) + 1
           FROM patients
           WHERE registration_number ~ '^ORC-[0-9]{4}-[0-9]+$'),
          1
        ),
        false
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP SEQUENCE IF EXISTS patient_reg_num_seq;`);
  }

}
