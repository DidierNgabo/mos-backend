import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { User } from 'src/users/entities/user.entity';

export interface AuthorizedAiContext {
  user: AuthenticatedUser;
  outreachId: string;
  outreachName: string;
}

@Injectable()
export class AiAccessService {
  constructor(
    @InjectRepository(User)
    private readonly users: EntityRepository<User>,
    @InjectRepository(Outreach)
    private readonly outreaches: EntityRepository<Outreach>,
  ) {}

  async authorize(
    user: AuthenticatedUser,
    outreachId: string,
  ): Promise<AuthorizedAiContext> {
    const outreach = await this.outreaches.findOne({ id: outreachId });
    if (!outreach) throw new NotFoundException('Outreach not found');

    if (!user.roles.includes('SUPER_ADMIN')) {
      const dbUser = await this.users.findOne(
        { id: user.id },
        { populate: ['outreaches'] },
      );
      const assigned =
        dbUser?.outreaches.getItems().some((item) => item.id === outreachId) ??
        false;
      if (!assigned) {
        throw new ForbiddenException(
          'You are not assigned to the selected outreach',
        );
      }
    }

    return {
      user,
      outreachId,
      outreachName: outreach.name,
    };
  }
}
