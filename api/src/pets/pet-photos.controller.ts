import { Controller, Get, NotFoundException, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PetsService } from './pets.service';

const CONTENT_TYPE_BY_EXTENSION : Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp'
};

@UseGuards(JwtAuthGuard)
@Controller('pets/:petId/photo')
export class PetPhotosController {
	constructor(
    private readonly petsService: PetsService,
    private readonly i18n: I18nService
	) {}

  @Get(':filename')
	async getPhoto(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
    @I18nLang() lang: string
	) {
		if (!/^[a-zA-Z0-9-]+\.(jpg|png|gif|webp)$/.test(filename)) {
			throw new NotFoundException(this.i18n.t('pets.photoNotFound', { lang }));
		}

		await this.petsService.assertUserIsTutor(petId, user.userId, lang);
		const pet = await this.petsService.getPetOrFail(petId, lang);
		if (pet.photoFilename !== filename) {
			throw new NotFoundException(this.i18n.t('pets.photoNotFound', { lang }));
		}

		const path = this.petsService.resolvePhotoPath(filename);
		if (!existsSync(path)) {
			throw new NotFoundException(this.i18n.t('pets.photoNotFound', { lang }));
		}

		res.set('X-Content-Type-Options', 'nosniff');
		res.set('Content-Disposition', 'inline');
		return res.sendFile(path, {
			headers: { 'Content-Type': CONTENT_TYPE_BY_EXTENSION[filename.slice(filename.lastIndexOf('.'))] }
		});
	}
}
