import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DBHOST, DBNAME, DBUSER, DBPASSWORD, DBPORT } from './config/config';

const config: Options = {
  forceUtcTimezone: true,
  entities: ['./dist/**/*.entity.js', './dist/**/*.ts'],
  entitiesTs: ['./src/**/*.entity.ts'],
  dbName: DBNAME,
  user: DBUSER,
  password: DBPASSWORD,
  driver: PostgreSqlDriver,
  host: DBHOST,
  port: parseInt(DBPORT as string),
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
  seeder: {
    path: './dist/seeders',
    pathTs: './src/seeders',
    defaultSeeder: 'RoleSeeder',
    glob: '!(*.d).{js,ts}',
  },
  allowGlobalContext: true,
};

export default config;
