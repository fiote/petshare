import { IsDateString, IsString } from 'class-validator';

export class SetDayDto {
  @IsDateString()
  	date: string;

  @IsString()
  	petTutorId: string;
}
