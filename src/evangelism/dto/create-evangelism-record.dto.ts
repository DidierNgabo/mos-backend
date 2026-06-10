import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEvangelismRecordDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiPropertyOptional({
    description: 'Existing patient this record is linked to, if any',
  })
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiProperty({ description: 'Name of the person being evangelized' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description:
      "III.A — Ese hari ibintu cyangwa indwara wifuza ko Yesu yagukiza?",
  })
  @IsString()
  @IsOptional()
  healingRequest?: string;

  @ApiPropertyOptional({
    description: 'III.B — Ese hari ibyaha wumva Yesu yakubabarira?',
  })
  @IsString()
  @IsOptional()
  sinsToConfess?: string;

  @ApiPropertyOptional({ description: 'IV.a — Narakijijwe', default: false })
  @IsBoolean()
  @IsOptional()
  isSaved?: boolean = false;

  @ApiPropertyOptional({
    description: "IV.b — Nemeye kwakira Yesu nk'Umwami n'Umukiza",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  acceptedJesus?: boolean = false;

  @ApiPropertyOptional({
    description:
      "IV.c — Ndifuza gukomeza kwiga Ijambo ry'Imana no gusengerwa",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  continueTheJourney?: boolean = false;

  @ApiPropertyOptional({
    description: 'IV.d — Nifuza ko bankurikira (Follow-up)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  followUp?: boolean = false;

  @ApiPropertyOptional({ description: 'IV.e — Ndifashe', default: false })
  @IsBoolean()
  @IsOptional()
  notSure?: boolean = false;

  @ApiPropertyOptional({ description: 'IV.f — Ntabyo nshaka', default: false })
  @IsBoolean()
  @IsOptional()
  declined?: boolean = false;

  @ApiPropertyOptional({ description: 'V — Isengesho (prayer request)' })
  @IsString()
  @IsOptional()
  prayerRequest?: string;
}
