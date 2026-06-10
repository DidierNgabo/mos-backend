import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommunicableDiseasesModule } from './communicable-diseases/communicable-diseases.module';
import { EmailModule } from './email/email.module';
import { EvangelismModule } from './evangelism/evangelism.module';
import { LabResultsModule } from './lab-results/lab-results.module';
import config from './mikro-orm.config';
import { ObservationsModule } from './observations/observations.module';
import { OutreachesModule } from './outreaches/outreaches.module';
import { PatientsModule } from './patients/patients.module';
import { PharmacyStockModule } from './pharmacy-stock/pharmacy-stock.module';
import { QueueEntriesModule } from './queue-entries/queue-entries.module';
import { RolesModule } from './roles/roles.module';
import { StationsModule } from './stations/stations.module';
import { GAD7ScreeningsModule } from './gad7-screenings/gad7-screenings.module';
import { PCL5ScreeningsModule } from './pcl5-screenings/pcl5-screenings.module';
import { PHQ9ScreeningsModule } from './phq9-screenings/phq9-screenings.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ReportsModule } from './reports/reports.module';
import { StatsModule } from './stats/stats.module';
import { TeamsModule } from './teams/teams.module';
import { TransfersModule } from './transfers/transfers.module';
import { UsersModule } from './users/users.module';
import { VitalSignsModule } from './vital-signs/vital-signs.module';

@Module({
  imports: [
    MikroOrmModule.forRoot({ ...config }),
    EmailModule,
    RolesModule,
    UsersModule,
    AuthModule,
    OutreachesModule,
    StationsModule,
    PatientsModule,
    VitalSignsModule,
    PharmacyStockModule,
    QueueEntriesModule,
    ObservationsModule,
    LabResultsModule,
    CommunicableDiseasesModule,
    TransfersModule,
    PrescriptionsModule,
    PHQ9ScreeningsModule,
    GAD7ScreeningsModule,
    PCL5ScreeningsModule,
    TeamsModule,
    StatsModule,
    ReportsModule,
    EvangelismModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
