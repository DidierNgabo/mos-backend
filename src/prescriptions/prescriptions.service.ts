import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { PharmacyStock } from 'src/pharmacy-stock/entities/pharmacy-stock.entity';
import { PharmacyStockService } from 'src/pharmacy-stock/pharmacy-stock.service';
import { TransactionType } from 'src/pharmacy-stock/entities/stock-transaction.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionQueryDto } from './dto/query-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { DEFAULT_PROJECTION, Prescription, PrescriptionProjection, PrescriptionStatus } from './entities/prescription.entity';
import { PrescriptionsMapper } from './prescriptions.mapper';

@Injectable()
export class PrescriptionsService extends MikroOrmEntityService<
  Prescription,
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  PrescriptionQueryDto,
  PrescriptionProjection
> {
  constructor(
    mapper: PrescriptionsMapper,
    @InjectRepository(Prescription)
    repository: EntityRepository<Prescription>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly pharmacyStockService: PharmacyStockService,
  ) {
    super(mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createPrescription(dto: CreatePrescriptionDto, prescribedById: string): Promise<Prescription> {
    const prescribedBy = await this.userRepository.findOne({ id: prescribedById });
    if (!prescribedBy) throw new BadRequestException('Prescribing user not found');

    const prescription = (this as any).mapper.fromCreateDto(dto) as Prescription;
    prescription.prescribedBy = prescribedBy;

    try {
      await this.entityManager.persist(prescription).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(prescription.id) as Promise<Prescription>;
  }

  async dispense(id: string, dispensedById: string): Promise<Prescription> {
    const prescription = await this.repository.findOne(
      { id },
      { populate: ['pharmacyStock'] },
    );
    if (!prescription) throw new NotFoundException('Prescription not found');
    if (prescription.status !== PrescriptionStatus.PENDING) {
      throw new BadRequestException(`Prescription is already ${prescription.status.toLowerCase()}`);
    }

    const stock = prescription.pharmacyStock as any;
    const stockId = stock.id ?? stock;

    await this.entityManager.begin();
    try {
      // Lock the stock row for the duration of this transaction so concurrent
      // dispenses cannot both pass the quantity check before either decrements.
      const stockRecord = await this.entityManager.findOne(
        PharmacyStock,
        { id: stockId },
        { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
      );
      if (!stockRecord) throw new NotFoundException('Pharmacy stock item not found');
      if (stockRecord.quantityInStock < prescription.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${stockRecord.quantityInStock}, Required: ${prescription.quantity}`,
        );
      }

      await this.pharmacyStockService.recordTransaction(
        stockId,
        {
          transactionType: TransactionType.DISPENSE,
          quantity: prescription.quantity,
          notes: `Dispensed for prescription ${id}`,
        },
        dispensedById,
      );

      prescription.status = PrescriptionStatus.DISPENSED;
      prescription.dispensedAt = new Date();
      (prescription as any).dispensedBy = { id: dispensedById };

      await this.entityManager.flush();
      await this.entityManager.commit();
    } catch (err) {
      await this.entityManager.rollback();
      throw err;
    }

    return this.find(id) as Promise<Prescription>;
  }

  async cancel(id: string): Promise<Prescription> {
    const prescription = await this.repository.findOne({ id });
    if (!prescription) throw new NotFoundException('Prescription not found');
    if (prescription.status !== PrescriptionStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel a ${prescription.status.toLowerCase()} prescription`);
    }
    prescription.status = PrescriptionStatus.CANCELLED;
    await this.entityManager.flush();
    return this.find(id) as Promise<Prescription>;
  }
}
