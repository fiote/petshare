import { IsDateString } from 'class-validator';

export class ListRangeDto {
  @IsDateString()
  	from: string;

  @IsDateString()
  	to: string;
}
