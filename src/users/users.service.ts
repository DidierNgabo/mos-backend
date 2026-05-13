import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import * as xlsx from 'xlsx';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { EmailService } from 'src/email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserBulkInviteResult } from './users.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/query-user.dto';
import {
  DEFAULT_PROJECTION,
  User,
  UserProjection,
} from './entities/user.entity';
import { UserMapper } from './users.mapper';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService extends MikroOrmEntityService<
  User,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserProjection
> {
  constructor(
    private readonly userMapper: UserMapper,
    @InjectRepository(User)
    repository: EntityRepository<User>,
    entityManager: EntityManager,
    private readonly emailService: EmailService,
  ) {
    super(userMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.inviteUser(dto);
  }

  async inviteUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.repository.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException(
        `A user with email "${dto.email}" already exists`,
      );
    }

    const roles = await this.userMapper.resolveRoles(dto.roleIds);
    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException('One or more roleIds are invalid');
    }

    const plainPassword = this.generateRandomPassword();
    const user = this.userMapper.fromCreateDto(dto);
    user.id = randomUUID();
    user.passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = true;
    user.roles.set(roles);

    try {
      await this.entityManager.persist(user).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    await this.emailService.sendInvitation(
      user.email,
      user.firstName,
      plainPassword,
    );

    return this.find(user.id) as Promise<User>;
  }

  async bulkInvite(
    file: Express.Multer.File,
  ): Promise<QueryUserBulkInviteResult> {
    if (!file?.buffer) {
      throw new BadRequestException('An xlsx file is required');
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new BadRequestException('Spreadsheet has no sheets');

    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    const successes: string[] = [];
    const failures: Array<{ row: number; email?: string; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      const email = String(row.email ?? '').trim();
      try {
        const roleIds = String(row.roleIds ?? row.roles ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const dto: CreateUserDto = {
          firstName: String(row.firstName ?? '').trim(),
          lastName: String(row.lastName ?? '').trim(),
          email,
          roleIds,
          stationId: row.stationId
            ? String(row.stationId).trim()
            : undefined,
          isActive: true,
        };

        if (!dto.firstName || !dto.lastName || !dto.email || !roleIds.length) {
          throw new Error(
            'Missing required field (firstName, lastName, email, roleIds)',
          );
        }

        const created = await this.inviteUser(dto);
        successes.push(created.email);
      } catch (error) {
        failures.push({
          row: rowNumber,
          email: email || undefined,
          error: (error as Error).message,
        });
      }
    }

    return { successes, failures, total: rows.length };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne(
      { email },
      { populate: ['roles'], refresh: true },
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.repository.findOne({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;
    await this.entityManager.persistAndFlush(user);
  }

  async verifyPassword(user: User, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, user.passwordHash);
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    const user = await this.repository.findOne({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await this.entityManager.persistAndFlush(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.repository.findOne({ passwordResetToken: token });
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.repository.findOne({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.entityManager.persistAndFlush(user);
  }

  private generateRandomPassword(length = 14): string {
    return randomBytes(length).toString('base64url').slice(0, length);
  }
}
