import { IsEmail } from 'class-validator';

export class InviteTutorDto {
  @IsEmail()
  	email: string;
}
