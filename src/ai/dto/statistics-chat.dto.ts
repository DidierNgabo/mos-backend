import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class ChatMessageDto {
  @IsEnum(ChatMessageRole)
  role: ChatMessageRole;

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class StatisticsChatDto {
  @IsUUID()
  outreachId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
