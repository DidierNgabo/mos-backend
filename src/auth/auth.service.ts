import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { JWT_EXPIRES_IN } from 'src/config/config';
import { EmailService } from 'src/email/email.service';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.usersService.verifyPassword(user, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const roles = user.roles.getItems().map((r) => r.name);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      mustChangePassword: user.mustChangePassword,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: JWT_EXPIRES_IN,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        stationId: user.station?.id ?? null,
      },
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    await this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
    return { success: true };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Silent — don't reveal whether email exists

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersService.setPasswordResetToken(user.id, token, expires);
    await this.emailService.sendPasswordReset(user.email, user.firstName, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset link. Please request a new one.');
    }
    await this.usersService.resetPassword(user.id, newPassword);
  }
}
