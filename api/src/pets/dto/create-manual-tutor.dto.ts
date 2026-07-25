import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateManualTutorDto {
  @IsString()
  @MinLength(1)
  	name: string;

  @IsOptional()
  @IsEmail()
  	email?: string;
}
