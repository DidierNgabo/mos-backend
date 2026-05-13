import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Medical Outreach Management System')
  .setDescription(
    'API for Medical Outreach Management System - Manages bookings, packages, vouchers, vendors, and more. This service facilitates communication with other Doreville microservices.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication and authorization endpoints')
  .setContact(
    'Quartis Support',
    'https://quartis.rw',
    'support@quartis.rw',
  )
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:6000', 'Local Development Server')
  .addServer('https://api.quartis.rw', 'Production Server')
  .build();
