/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EntityRepository, EntityManager } from '@mikro-orm/knex';
import {
  microOrmPaginationOptions,
  Paginated,
  paginatedResponse,
} from '../utils/pagination.utils';
import { FilterQuery } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';

export interface EntityMapper<Entity, CreateDto, UpdateDto, QueryDto> {
  fromCreateDto(createDto: CreateDto): Entity | Promise<Entity>;
  filtersFromQueryDto(queryDto: QueryDto): FilterQuery<Entity>[];
  fromUpdateDto(id, dto: UpdateDto): Promise<Entity | null>;
}

export interface EntityOrphanRemover<UpdateDto> {
  removeOrphanSubEntitiesOnUpdate(id: any, dto: UpdateDto): Promise<void>;
}

interface IDClass {
  id: any;
}

export abstract class MikroOrmEntityService<
  Entity extends IDClass,
  CreateDto,
  UpdateDto,
  QueryDto,
  Projection,
> {
  protected constructor(
    private readonly mapper: EntityMapper<
      Entity,
      CreateDto,
      UpdateDto,
      QueryDto
    >,
    protected readonly repository: EntityRepository<Entity>,
    protected readonly entityManager: EntityManager,
    protected readonly defaultProjection: Projection[] = [],
    protected readonly orphanRemover?: EntityOrphanRemover<UpdateDto>,
  ) {}

  protected handleDatabaseConstraintError(
    error: any,
    isMultiple = false,
  ): void {
    console.log('getting here with error', error);
    // Check if it's a foreign key constraint violation
    if (
      error.code === '23503' ||
      error.message?.includes('foreign key constraint')
    ) {
      const message = isMultiple
        ? 'Cannot delete one or more items because they are referenced by other records. Please remove the associated records first.'
        : 'Cannot delete this item because it is referenced by other records. Please remove the associated records first.';
      throw new BadRequestException(message);
    }
    // Check for unique constraint violations
    if (
      error.code === '23505' ||
      error.message?.includes('unique constraint')
    ) {
      throw new BadRequestException(
        'This operation would create a duplicate entry. Please check your data and try again.',
      );
    }

    // Re-throw other errors
    throw error;
  }

  async create(dto: CreateDto): Promise<Entity> {
    const entity = await Promise.resolve(this.mapper.fromCreateDto(dto));
    try {
      await this.entityManager.persist(entity).flush();
      return this.find(entity.id) as Promise<Entity>;
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }
  }

  async createAll(dtos: CreateDto[]) {
    const entities = dtos.map((dto) => this.mapper.fromCreateDto(dto));
    try {
      return await this.entityManager.persist(entities).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, true);
    }
  }

  async find(
    id: any,
    projections: Projection[] = this.defaultProjection,
  ): Promise<Entity | null> {
    return this.repository.findOne(
      // @ts-ignore
      { id },
      { populate: projections, refresh: true },
    );
  }

  async findAll(
    query: QueryDto,
    orderBy?: { key: string, value: 'asc' | 'desc' },
    projections: Projection[] = this.defaultProjection,
  ): Promise<Paginated<Entity>> {
    const filters = this.mapper.filtersFromQueryDto(query);
    const [items, totalNumItems] = await this.repository.findAndCount(
      // @ts-ignore
      { $and: filters },
      {
        ...microOrmPaginationOptions(query),
        populate: projections,
        ...(orderBy?{orderBy:{[orderBy.key]:orderBy.value}}:{})
      },
    );
    return paginatedResponse(items, totalNumItems, query);
  }

  async update(id: any, dto: UpdateDto): Promise<Entity | null> {
    const entity = await this.mapper.fromUpdateDto(id, dto);
    if (!entity) return entity;
    await this.orphanRemover?.removeOrphanSubEntitiesOnUpdate(id, dto);
    console.log('Entity to update:', entity);
    try {
      await this.entityManager.persistAndFlush(entity);
      return this.find(entity.id);
    } catch (error) {
      console.log('Error in update:', error);
      this.handleDatabaseConstraintError(error, false);
    }
  }

  async updateAll(dtos: (UpdateDto & { id: any })[]) {
    const videos = await Promise.all(
      dtos.map(async (dto) => {
        await this.orphanRemover?.removeOrphanSubEntitiesOnUpdate(dto.id, dto);
        return this.mapper.fromUpdateDto(dto.id, dto);
      }),
    );
    try {
      return await this.entityManager.persistAndFlush(videos);
    } catch (error) {
      this.handleDatabaseConstraintError(error, true);
    }
  }

  async remove(id: any): Promise<number> {
    const entity = await this.find(id);
    if (!entity) return 0;

    try {
      await this.entityManager.remove(entity).flush();
      return 1;
    } catch (error) {
      console.log('Error deleting package', error);
      this.handleDatabaseConstraintError(error, false);
    }
  }

  async removeAll(query: QueryDto): Promise<number> {
    const entities = (await this.findAll(query)).items;
    entities.forEach((video) => this.entityManager.remove(video));

    try {
      await this.entityManager.flush();
      return entities.length;
    } catch (error) {
      this.handleDatabaseConstraintError(error, true);
    }
  }

  async upsert(dto: CreateDto & { id: any }): Promise<Entity> {
    const entity = await this.find(dto.id);
    if (!entity) return this.create(dto);
    // @ts-ignore
    return this.update(dto.id, dto);
  }

  async upsertAll(dtos: (CreateDto & { id: any })[]) {
    for (const dto of dtos) {
      await this.upsert(dto);
    }
  }
}
