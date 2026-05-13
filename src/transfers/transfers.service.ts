import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferQueryDto } from './dto/query-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { DEFAULT_PROJECTION, Transfer, TransferProjection } from './entities/transfer.entity';
import { TransfersMapper } from './transfers.mapper';

@Injectable()
export class TransfersService extends MikroOrmEntityService<
  Transfer,
  CreateTransferDto,
  UpdateTransferDto,
  TransferQueryDto,
  TransferProjection
> {
  constructor(
    private readonly transfersMapper: TransfersMapper,
    @InjectRepository(Transfer)
    repository: EntityRepository<Transfer>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(transfersMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createTransfer(dto: CreateTransferDto, initiatedById: string): Promise<Transfer> {
    const initiatedBy = await this.userRepository.findOne({ id: initiatedById });
    if (!initiatedBy) throw new BadRequestException('User not found');

    const t = this.transfersMapper.fromCreateDto(dto) as Transfer;
    t.id = randomUUID();
    t.initiatedBy = initiatedBy;

    try {
      await this.entityManager.persist(t).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(t.id) as Promise<Transfer>;
  }
}
