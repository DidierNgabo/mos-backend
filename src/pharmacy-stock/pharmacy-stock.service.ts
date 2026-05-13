import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { PaginationQueryDto, paginatedResponse } from 'src/utils/pagination.utils';
import { User } from 'src/users/entities/user.entity';
import { CreatePharmacyStockDto } from './dto/create-pharmacy-stock.dto';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { PharmacyStockQueryDto } from './dto/query-pharmacy-stock.dto';
import { UpdatePharmacyStockDto } from './dto/update-pharmacy-stock.dto';
import { PharmacyStock, DEFAULT_PROJECTION, PharmacyStockProjection } from './entities/pharmacy-stock.entity';
import { StockTransaction, TransactionType } from './entities/stock-transaction.entity';
import { PharmacyStockMapper } from './pharmacy-stock.mapper';

const STOCK_INCREASE_TYPES = new Set([TransactionType.RESTOCK, TransactionType.RETURN]);

@Injectable()
export class PharmacyStockService extends MikroOrmEntityService<
  PharmacyStock,
  CreatePharmacyStockDto,
  UpdatePharmacyStockDto,
  PharmacyStockQueryDto,
  PharmacyStockProjection
> {
  constructor(
    mapper: PharmacyStockMapper,
    @InjectRepository(PharmacyStock)
    repository: EntityRepository<PharmacyStock>,
    entityManager: EntityManager,
    @InjectRepository(StockTransaction)
    private readonly transactionRepository: EntityRepository<StockTransaction>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async recordTransaction(
    stockId: string,
    dto: CreateStockTransactionDto,
    userId: string,
  ): Promise<StockTransaction> {
    const stock = await this.repository.findOne({ id: stockId }, { populate: ['outreach'] });
    if (!stock) throw new NotFoundException('Pharmacy stock item not found');

    const performer = await this.userRepository.findOne({ id: userId });
    if (!performer) throw new BadRequestException('Performer user not found');

    const quantityBefore = stock.quantityInStock;
    let quantityAfter: number;

    if (STOCK_INCREASE_TYPES.has(dto.transactionType)) {
      quantityAfter = quantityBefore + dto.quantity;
    } else {
      quantityAfter = Math.max(0, quantityBefore - dto.quantity);
    }

    const transaction = Object.assign(new StockTransaction(), {
      pharmacyStock: stock,
      outreach: stock.outreach,
      transactionType: dto.transactionType,
      quantity: dto.quantity,
      quantityBefore,
      quantityAfter,
      notes: dto.notes ?? null,
      performedBy: performer,
    });

    stock.quantityInStock = quantityAfter;
    stock.lastUpdatedBy = performer;

    await this.entityManager.persistAndFlush([stock, transaction]);

    return this.transactionRepository.findOne(
      { id: transaction.id },
      { populate: ['performedBy', 'pharmacyStock'] },
    );
  }

  async getTransactions(
    stockId: string,
    query: PaginationQueryDto,
  ) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    const [items, totalNumItems] = await this.transactionRepository.findAndCount(
      { pharmacyStock: { id: stockId } },
      {
        populate: ['performedBy'],
        orderBy: { createdAt: 'desc' },
        limit,
        offset,
      },
    );

    return paginatedResponse(items, totalNumItems, query);
  }
}
