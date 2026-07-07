import { Migration } from '@mikro-orm/migrations';

export class Migration20260707065107 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_systolic" type int using ("blood_pressure_systolic"::int);`);
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_systolic" drop not null;`);
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_diastolic" type int using ("blood_pressure_diastolic"::int);`);
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_diastolic" drop not null;`);
    this.addSql(`alter table "vital_signs" alter column "pulse_rate" type numeric(5,1) using ("pulse_rate"::numeric(5,1));`);
    this.addSql(`alter table "vital_signs" alter column "pulse_rate" drop not null;`);
    this.addSql(`alter table "vital_signs" alter column "weight" type numeric(5,2) using ("weight"::numeric(5,2));`);
    this.addSql(`alter table "vital_signs" alter column "weight" drop not null;`);
    this.addSql(`alter table "vital_signs" alter column "height" type numeric(5,2) using ("height"::numeric(5,2));`);
    this.addSql(`alter table "vital_signs" alter column "height" drop not null;`);
    this.addSql(`alter table "vital_signs" alter column "bmi" type numeric(5,2) using ("bmi"::numeric(5,2));`);
    this.addSql(`alter table "vital_signs" alter column "bmi" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_systolic" type int4 using ("blood_pressure_systolic"::int4);`);
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_systolic" set not null;`);
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_diastolic" type int4 using ("blood_pressure_diastolic"::int4);`);
    this.addSql(`alter table "vital_signs" alter column "blood_pressure_diastolic" set not null;`);
    this.addSql(`alter table "vital_signs" alter column "pulse_rate" type numeric(5,1) using ("pulse_rate"::numeric(5,1));`);
    this.addSql(`alter table "vital_signs" alter column "pulse_rate" set not null;`);
    this.addSql(`alter table "vital_signs" alter column "weight" type numeric(5,2) using ("weight"::numeric(5,2));`);
    this.addSql(`alter table "vital_signs" alter column "weight" set not null;`);
    this.addSql(`alter table "vital_signs" alter column "height" type numeric(5,2) using ("height"::numeric(5,2));`);
    this.addSql(`alter table "vital_signs" alter column "height" set not null;`);
    this.addSql(`alter table "vital_signs" alter column "bmi" type numeric(5,2) using ("bmi"::numeric(5,2));`);
    this.addSql(`alter table "vital_signs" alter column "bmi" set not null;`);
  }

}
