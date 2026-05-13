import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { CreatePharmacyStockDto } from './dto/create-pharmacy-stock.dto';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { PharmacyStockQueryDto } from './dto/query-pharmacy-stock.dto';
import { UpdatePharmacyStockDto } from './dto/update-pharmacy-stock.dto';
import { PharmacyStockService } from './pharmacy-stock.service';

@ApiBearerAuth()
@Controller('pharmacy-stock')
export class PharmacyStockController {
  constructor(private readonly pharmacyStockService: PharmacyStockService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'PharmacyStock'))
  @ApiOperation({ summary: 'Add a medication to pharmacy stock' })
  create(@Body() dto: CreatePharmacyStockDto) {
    return this.pharmacyStockService.create(dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'PharmacyStock'))
  @ApiOperation({ summary: 'List pharmacy stock with filtering and pagination' })
  findAll(@Query() query: PharmacyStockQueryDto) {
    return this.pharmacyStockService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'PharmacyStock'))
  @ApiOperation({ summary: 'Get a single pharmacy stock item' })
  findOne(@Param('id') id: string) {
    return this.pharmacyStockService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'PharmacyStock'))
  @ApiOperation({ summary: 'Update a pharmacy stock item' })
  update(@Param('id') id: string, @Body() dto: UpdatePharmacyStockDto) {
    return this.pharmacyStockService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'PharmacyStock'))
  @ApiOperation({ summary: 'Remove a pharmacy stock item' })
  remove(@Param('id') id: string) {
    return this.pharmacyStockService.remove(id);
  }

  @Post(':id/transactions')
  @CheckPolicies((ability) => ability.can(Action.Update, 'PharmacyStock'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a stock transaction (restock, dispense, etc.)' })
  recordTransaction(
    @Param('id') id: string,
    @Body() dto: CreateStockTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pharmacyStockService.recordTransaction(id, dto, user.id);
  }

  @Get(':id/transactions')
  @CheckPolicies((ability) => ability.can(Action.Read, 'PharmacyStock'))
  @ApiOperation({ summary: 'List transactions for a pharmacy stock item' })
  getTransactions(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.pharmacyStockService.getTransactions(id, query);
  }
}
