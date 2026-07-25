import { BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { I18nLang } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { InviteTutorDto } from './dto/invite-tutor.dto';
import { CreateManualTutorDto } from './dto/create-manual-tutor.dto';
import { I18nService } from 'nestjs-i18n';

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@UseGuards(JwtAuthGuard)
@Controller()
export class PetsController {
	constructor(
    private readonly petsService: PetsService,
    private readonly i18n: I18nService
	) {}

  @Post('pets')
	createPet(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePetDto,
    @I18nLang() lang: string
	) {
		return this.petsService.createPet(user.userId, dto, lang);
	}

  @Get('pets')
  listPets(@CurrentUser() user: CurrentUserPayload) {
  	return this.petsService.listPetsForUser(user.userId);
  }

  @Delete('pets/:petId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePet(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @I18nLang() lang: string
  ) {
  	await this.petsService.deletePet(petId, user.userId, lang);
  }

  @Get('pets/:petId/tutors')
  async getPetTutors(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @I18nLang() lang: string
  ) {
  	await this.petsService.assertUserIsTutor(petId, user.userId, lang);
  	return this.petsService.getPetTutors(petId);
  }

  @Post('pets/:petId/photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_SIZE_BYTES } }))
  uploadPetPhoto(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @UploadedFile() file: Express.Multer.File,
    @I18nLang() lang: string
  ) {
  	if (!file) {
  		throw new BadRequestException(this.i18n.t('pets.noFileUploaded', { lang }));
  	}
  	if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.mimetype)) {
  		throw new BadRequestException(this.i18n.t('pets.unsupportedImageFormat', { lang }));
  	}
  	return this.petsService.updatePetPhoto(petId, user.userId, file, lang);
  }

  @Post('pets/:petId/manual-tutors')
  createManualTutor(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @Body() dto: CreateManualTutorDto,
    @I18nLang() lang: string
  ) {
  	return this.petsService.createManualTutor(petId, user.userId, dto.name, lang, dto.email);
  }

  @Post('pets/:petId/invitations')
  inviteTutor(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @Body() dto: InviteTutorDto,
    @I18nLang() lang: string
  ) {
  	return this.petsService.inviteTutor(petId, user.userId, dto.email, lang);
  }

  @Post('invitations/:token/accept')
  acceptInvitation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('token') token: string,
    @I18nLang() lang: string
  ) {
  	return this.petsService.acceptInvitation(token, user.userId, lang);
  }

  @Post('invitations/by-id/:invitationId/accept')
  acceptInvitationById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('invitationId') invitationId: string,
    @I18nLang() lang: string
  ) {
  	return this.petsService.acceptInvitationById(invitationId, user.userId, lang);
  }

  @Get('invitations/pending')
  listPendingInvitations(@CurrentUser() user: CurrentUserPayload) {
  	return this.petsService.listPendingInvitationsForUser(user.email);
  }
}
