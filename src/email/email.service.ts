import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { MailtrapClient } from 'mailtrap';
import { APP_URL, MAIL_FROM, MAIL_FROM_NAME, MAILTRAP_TOKEN } from 'src/config/config';

export enum EmailTemplate {
  USER_INVITATION = 'user-invitation',
  PASSWORD_RESET = 'password-reset',
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: MailtrapClient | null;

  constructor() {
    this.client = MAILTRAP_TOKEN
      ? new MailtrapClient({ token: MAILTRAP_TOKEN })
      : null;

    handlebars.registerHelper('json', (context) => JSON.stringify(context));
    handlebars.registerHelper('stripHtml', (html: string) => {
      if (!html) return '';
      if (!/<[^>]+>/.test(html)) return html.trim();
      return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x60;/g, '`')
        .replace(/&hellip;/g, '...')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    });
  }

  async compileEmail(
    template: EmailTemplate,
    args: Record<string, unknown>,
  ): Promise<string> {
    const templatePath = `./src/email-templates/${template}.hbs`;
    const source = fs.readFileSync(templatePath).toString();
    const compiled = handlebars.compile(source, { strict: true });
    return compiled(args);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        `MAILTRAP_TOKEN not set — logging email instead of sending. To=${to} Subject="${subject}"`,
      );
      return;
    }
    try {
      await this.client.send({
        from: { email: MAIL_FROM, name: MAIL_FROM_NAME },
        to: [{ email: to }],
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, (error as Error).message);
      throw error;
    }
  }

  async sendInvitation(
    to: string,
    firstName: string,
    temporaryPassword: string,
  ): Promise<void> {
    const html = await this.compileEmail(EmailTemplate.USER_INVITATION, {
      firstName,
      email: to,
      temporaryPassword,
      appUrl: APP_URL,
    });
    await this.sendEmail(to, 'Your MOS account credentials', html);
  }

  async sendPasswordReset(
    to: string,
    firstName: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = await this.compileEmail(EmailTemplate.PASSWORD_RESET, {
      firstName,
      resetLink,
    });
    await this.sendEmail(to, 'Reset your MOS password', html);
  }
}
