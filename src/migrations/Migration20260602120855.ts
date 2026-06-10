import { Migration } from '@mikro-orm/migrations';

export class Migration20260602120855 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create index "stations_outreach_id_index" on "stations" ("outreach_id");`);

    this.addSql(`create index "patients_outreach_id_index" on "patients" ("outreach_id");`);

    this.addSql(`create index "queue_entries_outreach_id_patient_id_index" on "queue_entries" ("outreach_id", "patient_id");`);

    this.addSql(`create index "station_visits_queue_entry_id_index" on "station_visits" ("queue_entry_id");`);

    this.addSql(`create index "prescriptions_queue_entry_id_index" on "prescriptions" ("queue_entry_id");`);
    this.addSql(`create index "prescriptions_outreach_id_index" on "prescriptions" ("outreach_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "patients_outreach_id_index";`);

    this.addSql(`drop index "prescriptions_queue_entry_id_index";`);
    this.addSql(`drop index "prescriptions_outreach_id_index";`);

    this.addSql(`drop index "queue_entries_outreach_id_patient_id_index";`);

    this.addSql(`drop index "station_visits_queue_entry_id_index";`);

    this.addSql(`drop index "stations_outreach_id_index";`);
  }

}
