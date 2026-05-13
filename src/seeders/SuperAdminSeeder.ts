import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { MailtrapClient } from 'mailtrap';
import {
  APP_URL,
  MAIL_FROM,
  MAIL_FROM_NAME,
  MAILTRAP_TOKEN,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_FIRST_NAME,
  SUPER_ADMIN_LAST_NAME,
} from '../config/config';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
const BCRYPT_ROUNDS = 10;

export class SuperAdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_FIRST_NAME || !SUPER_ADMIN_LAST_NAME) {
      console.log(
        '[SuperAdminSeeder] SUPER_ADMIN_EMAIL / FIRST_NAME / LAST_NAME not set — skipping.',
      );
      return;
    }

    const existing = await em.findOne(User, { email: SUPER_ADMIN_EMAIL });
    if (existing) {
      console.log(
        `[SuperAdminSeeder] Super admin "${SUPER_ADMIN_EMAIL}" already exists — skipping.`,
      );
      return;
    }

    const superAdminRole = await em.findOne(Role, { name: SUPER_ADMIN_ROLE });
    if (!superAdminRole) {
      console.error(
        `[SuperAdminSeeder] Role "${SUPER_ADMIN_ROLE}" not found. Run RoleSeeder first.`,
      );
      return;
    }

    const temporaryPassword = randomBytes(14).toString('base64url').slice(0, 14);

    const user = em.create(User, {
      id: randomUUID(),
      firstName: SUPER_ADMIN_FIRST_NAME,
      lastName: SUPER_ADMIN_LAST_NAME,
      email: SUPER_ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS),
      isActive: true,
      mustChangePassword: true,
    });

    em.persist(user);
    await em.flush();

    // Attach role through the pivot table after the user row is persisted.
    user.roles.add(superAdminRole);
    await em.flush();

    await this.sendInvitationEmail(
      SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_FIRST_NAME,
      temporaryPassword,
    );

    console.log(
      `[SuperAdminSeeder] Super admin "${SUPER_ADMIN_EMAIL}" created successfully.`,
    );
  }

  private async sendInvitationEmail(
    to: string,
    firstName: string,
    temporaryPassword: string,
  ): Promise<void> {
    if (!MAILTRAP_TOKEN) {
      // No mail provider configured — log credentials so the operator can
      // set the password manually. This only happens on the very first boot.
      console.warn(
        '\n========================================================\n' +
        '[SuperAdminSeeder] MAILTRAP_TOKEN not set.\n' +
        'Super admin credentials (store these securely):\n' +
        `  Email:    ${to}\n` +
        `  Password: ${temporaryPassword}\n` +
        '========================================================\n',
      );
      return;
    }

    try {
      const templatePath = './src/email-templates/user-invitation.hbs';
      const source = fs.readFileSync(templatePath).toString();
      const html = handlebars.compile(source, { strict: true })({
        firstName,
        email: to,
        temporaryPassword,
        appUrl: APP_URL,
      });

      const client = new MailtrapClient({ token: MAILTRAP_TOKEN });
      await client.send({
        from: { email: MAIL_FROM, name: MAIL_FROM_NAME },
        to: [{ email: to }],
        subject: 'Your MOS super admin account',
        html,
      });
      console.log(`[SuperAdminSeeder] Invitation email sent to "${to}".`);
    } catch (error) {
      console.error('[SuperAdminSeeder] Failed to send invitation email:', error);
      console.warn(
        `[SuperAdminSeeder] Temporary password (set this manually): ${temporaryPassword}`,
      );
    }
  }
}
