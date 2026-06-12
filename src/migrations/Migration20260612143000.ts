import { Migration } from '@mikro-orm/migrations';

export class Migration20260612143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "teams" add column "station_id" uuid null;');
    this.addSql(
      'alter table "teams" add constraint "teams_station_id_foreign" foreign key ("station_id") references "stations" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'create index "teams_station_id_index" on "teams" ("station_id");',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop index "teams_station_id_index";');
    this.addSql(
      'alter table "teams" drop constraint "teams_station_id_foreign";',
    );
    this.addSql('alter table "teams" drop column "station_id";');
  }
}
