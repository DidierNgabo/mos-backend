import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;


  @ApiProperty({
    description: 'Whether the role is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
