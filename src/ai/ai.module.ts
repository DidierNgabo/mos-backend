import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { StatsModule } from 'src/stats/stats.module';
import { User } from 'src/users/entities/user.entity';
import { AiAccessService } from './ai-access.service';
import { AiController } from './ai.controller';
import { AiRateLimitService } from './ai-rate-limit.service';
import { AiService } from './ai.service';
import { AiToolRegistryService } from './ai-tool-registry.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Outreach]), StatsModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiAccessService,
    AiRateLimitService,
    AiToolRegistryService,
  ],
})
export class AiModule {}
