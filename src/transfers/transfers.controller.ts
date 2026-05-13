import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferQueryDto } from './dto/query-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransfersService } from './transfers.service';

@ApiBearerAuth()
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'Transfer').some((r) => !r.inverted))
  create(@Body() dto: CreateTransferDto, @CurrentUser() user: AuthenticatedUser) {
    return this.transfersService.createTransfer(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Transfer').some((r) => !r.inverted))
  findAll(@Query() query: TransferQueryDto) {
    return this.transfersService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Transfer').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.transfersService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'Transfer').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdateTransferDto) {
    return this.transfersService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Transfer'))
  remove(@Param('id') id: string) {
    return this.transfersService.remove(id);
  }
}
