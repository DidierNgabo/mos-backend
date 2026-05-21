import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { randomUUID } from 'crypto';
import { Outreach } from '../outreaches/entities/outreach.entity';
import { DEFAULT_TEAM_HIERARCHY, Team } from '../teams/entities/team.entity';

export class TeamSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const outreaches = await em.find(Outreach, {});

    for (const outreach of outreaches) {
      const existing = await em.count(Team, { outreach });
      if (existing > 0) continue;

      for (const group of DEFAULT_TEAM_HIERARCHY) {
        const parentTeam = em.create(Team, {
          id: randomUUID(),
          outreach,
          name: group.name,
          type: group.type,
          isActive: true,
        });
        for (const childName of group.children) {
          em.create(Team, {
            id: randomUUID(),
            outreach,
            name: childName,
            parent: parentTeam,
            isActive: true,
          });
        }
      }
    }

    await em.flush();
  }
}
