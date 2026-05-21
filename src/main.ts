import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { RoleSeeder } from './seeders/RoleSeeder';
import { SuperAdminSeeder } from './seeders/SuperAdminSeeder';
import { TeamSeeder } from './seeders/TeamSeeder';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

   // swagger configuration
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  // Add endpoint to export swagger JSON
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/docs-json', (_req, res) => res.json(document));

  try {
    // Automatically seed the database roles before processing web traffic
    const orm = app.get(MikroORM);
    const seeder = orm.seeder;
    await seeder.seed(RoleSeeder);       // must run first — super admin seeder depends on roles
    await seeder.seed(SuperAdminSeeder);
    await seeder.seed(TeamSeeder);       // backfills teams for existing outreaches

     await app.listen(process.env.PORT || 4000);
    console.log(
      `API is running on http://localhost:${process.env.PORT || 4000}`,
    );
  } catch (error) {
    console.error('Failed to start API:', error);
    process.exit(1);
  }
}
bootstrap();
