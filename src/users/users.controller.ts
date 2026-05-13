import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import 'multer';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/query-user.dto';
import { QueryUserBulkInviteResult } from './users.types';
import { UsersService } from './users.service';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'User'))
  @ApiOperation({
    summary: 'Invite a single user — generates credentials and emails them',
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.inviteUser(dto);
  }

  @Post('bulk-invite')
  @CheckPolicies((ability) => ability.can(Action.Create, 'User'))
  @ApiOperation({
    summary:
      'Bulk-invite users from an xlsx file (columns: firstName, lastName, email, roleIds, stationId)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  bulkInvite(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<QueryUserBulkInviteResult> {
    return this.usersService.bulkInvite(file);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'User'))
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'User'))
  findOne(@Param('id') id: string) {
    return this.usersService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'User'))
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'User'))
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
