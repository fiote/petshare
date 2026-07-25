import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'crypto';
import { mkdirSync, unlink } from 'fs';
import { join } from 'path';

const MAGIC_BYTES_BY_EXTENSION : Array<{ ext: string; matches: (buf: Buffer) => boolean }> = [
	{
		ext: '.jpg',
		matches: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
	},
	{
		ext: '.png',
		matches: (buf) =>
			buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
	},
	{
		ext: '.gif',
		matches: (buf) =>
			buf.length >= 6 &&
      (buf.toString('ascii', 0, 6) === 'GIF87a' || buf.toString('ascii', 0, 6) === 'GIF89a')
	},
	{
		ext: '.webp',
		matches: (buf) =>
			buf.length >= 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
	}
];

@Injectable()
export class PetPhotoStorageService {
	readonly directory: string;

	constructor(
		config: ConfigService,
    private readonly i18n: I18nService
	) {
		this.directory = config.get<string>('PET_PHOTOS_DIR') ?? '/app/uploads/pet-photos';
		mkdirSync(this.directory, { recursive: true });
	}

	/**
   * Detecta o tipo real do arquivo pelos magic bytes (nunca confia em
   * mimetype/nome enviados pelo cliente) e gera um nome com extensão segura.
   */
	buildFilename(buffer: Buffer, lang: string): string {
		const detected = MAGIC_BYTES_BY_EXTENSION.find((entry) => entry.matches(buffer));
		if (!detected) {
			throw new BadRequestException(this.i18n.t('pets.unsupportedImageFormat', { lang }));
		}
		return `${randomUUID()}${detected.ext}`;
	}

	resolvePath(filename: string): string {
		return join(this.directory, filename);
	}

	deletePhoto(filename: string): void {
		unlink(this.resolvePath(filename), () => {
			// arquivo pode já não existir; ignorar erro de remoção
		});
	}
}
