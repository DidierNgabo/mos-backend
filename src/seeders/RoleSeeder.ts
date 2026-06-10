import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import { Role } from '../roles/entities/role.entity';

export class RoleSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const defaultRoles = [
      'SUPER_ADMIN',
      'OUTREACH_ADMIN',
      'NURSE',
      'DOCTOR',
      'DATA_CLERK',
      'PHARMACIST',
      'EVANGELIST',
    ];

    for (const roleName of defaultRoles) {
      // Check if the role already exists to avoid duplication
      const existingRole = await em.findOne(Role, { name: roleName });

      if (!existingRole) {
        const role = em.create(Role, {
          id: randomUUID(),
          name: roleName,
          description: `Default system role for ${roleName}`,
          isActive: true,
          isDefault: true,
          isDeleted: false,
        });
        em.persist(role);
      }
    }

    // Flush all inserts at once for performance
    await em.flush();
  }
}
