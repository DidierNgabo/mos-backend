import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { CreatePharmacyStockDto } from './dto/create-pharmacy-stock.dto';
import { PharmacyStockQueryDto } from './dto/query-pharmacy-stock.dto';
import { UpdatePharmacyStockDto } from './dto/update-pharmacy-stock.dto';
import { PharmacyStock } from './entities/pharmacy-stock.entity';

@Injectable()
export class PharmacyStockMapper
  implements
    EntityMapper<
      PharmacyStock,
      CreatePharmacyStockDto,
      UpdatePharmacyStockDto,
      PharmacyStockQueryDto
    >
{
  constructor(
    @InjectRepository(PharmacyStock)
    private readonly repository: EntityRepository<PharmacyStock>,
    @InjectRepository(Outreach)
    private readonly outreachRepository: EntityRepository<Outreach>,
  ) {}

  async fromCreateDto(dto: CreatePharmacyStockDto): Promise<PharmacyStock> {
    const outreach = await this.outreachRepository.findOne({ id: dto.outreachId });
    const stock = Object.assign(new PharmacyStock(), {
      medicationName: dto.medicationName,
      genericName: dto.genericName,
      dosageForm: dto.dosageForm,
      strength: dto.strength,
      quantityInStock: dto.quantityInStock,
      lowStockThreshold: dto.lowStockThreshold,
      unitOfMeasure: dto.unitOfMeasure,
      category: dto.category ?? null,
      manufacturer: dto.manufacturer ?? null,
      batchNumber: dto.batchNumber ?? null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      outreach,
    });
    return stock;
  }

  async fromUpdateDto(
    id: string,
    dto: UpdatePharmacyStockDto,
  ): Promise<PharmacyStock | null> {
    const stock = await this.repository.findOne({ id });
    if (!stock) return null;

    const { outreachId, expiryDate, ...rest } = dto;
    this.repository.assign(stock, {
      ...rest,
      ...(expiryDate !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
    });

    if (outreachId !== undefined) {
      const outreach = await this.outreachRepository.findOne({ id: outreachId });
      stock.outreach = outreach;
    }

    return stock;
  }

  filtersFromQueryDto(query: PharmacyStockQueryDto): FilterQuery<PharmacyStock>[] {
    const outreachId: FilterQuery<PharmacyStock> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const dosageForm: FilterQuery<PharmacyStock> = query.dosageForm && {
      dosageForm: { $ilike: '%' + query.dosageForm + '%' },
    };
    const category: FilterQuery<PharmacyStock> = query.category && {
      category: { $ilike: '%' + query.category + '%' },
    };
    const isActive: FilterQuery<PharmacyStock> =
      query.isActive !== undefined && { isActive: query.isActive };
    const isLowStock: FilterQuery<PharmacyStock> =
      query.isLowStock !== undefined && { isLowStock: query.isLowStock };
    const createdAt: FilterQuery<PharmacyStock> = query.createdAt && {
      createdAt: { $gte: new Date(query.createdAt) },
    };
    const updatedAt: FilterQuery<PharmacyStock> = query.updatedAt && {
      updatedAt: { $gte: new Date(query.updatedAt) },
    };
    const globalSearch: FilterQuery<PharmacyStock> = query.search && {
      $or: [
        { medicationName: { $ilike: '%' + query.search + '%' } },
        { genericName: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      outreachId,
      dosageForm,
      category,
      isActive,
      isLowStock,
      createdAt,
      updatedAt,
      globalSearch,
    ].filter((f) => !!f);
  }
}
