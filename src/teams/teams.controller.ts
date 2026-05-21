import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamQueryDto } from './dto/query-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';

@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'Team').some((r) => !r.inverted))
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Team').some((r) => !r.inverted))
  findAll(@Query() query: TeamQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.roles.some((r) => ['SUPER_ADMIN', 'OUTREACH_ADMIN'].includes(r));
    if (!isAdmin) query.memberId = user.id;
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Team').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.teamsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'Team').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.updateTeam(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Team'))
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
