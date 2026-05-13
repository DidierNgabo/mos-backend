import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateVitalSignDto {
  @ApiProperty({ description: 'ID of the patient being examined' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'ID of the station where vitals are recorded' })
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  @Max(300)
  bloodPressureSystolic: number;

  @ApiProperty({ example: 80 })
  @IsInt()
  @Min(0)
  @Max(200)
  bloodPressureDiastolic: number;

  @ApiProperty({ example: 72, description: 'Pulse rate in bpm' })
  @IsNumber()
  @Min(0)
  @Max(300)
  pulseRate: number;

  @ApiProperty({ example: 37.0, description: 'Temperature in °C' })
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature: number;

  @ApiProperty({ example: 70.5, description: 'Weight in kg' })
  @IsNumber()
  @Min(0)
  @Max(500)
  weight: number;

  @ApiProperty({ example: 175.0, description: 'Height in cm' })
  @IsNumber()
  @Min(0)
  @Max(300)
  height: number;

  @ApiPropertyOptional({ example: 98.6, description: 'O₂ saturation in %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional({ example: 5.5, description: 'Blood glucose in mmol/L' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bloodGlucose?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
