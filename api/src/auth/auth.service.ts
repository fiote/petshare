import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PetsService } from '../pets/pets.service';
import { assertEmailCooldownElapsed } from '../common/email-cooldown';

const CONFIRMATION_TOKEN_TTL_HOURS = 48;
const PASSWORD_RESET_TOKEN_TTL_HOURS = 2;

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly petsService: PetsService,
    private readonly i18n: I18nService
	) {}

	async register(dto: RegisterDto, lang: string) {
		const genericMessage = { message: this.i18n.t('auth.registerSuccess', { lang }) };

		const existing = await this.usersService.findByEmail(dto.email);
		if (existing) {
			this.logger.warn(`Tentativa de cadastro com email já existente: ${dto.email}`);
			// Resposta idêntica ao caminho de sucesso para não permitir enumeração de emails cadastrados.
			return genericMessage;
		}

		const passwordHash = await bcrypt.hash(dto.password, 12);
		const emailConfirmationToken = randomUUID();
		const emailConfirmationTokenExpiresAt = new Date(
			Date.now() + CONFIRMATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
		);

		const user = await this.usersService.create({
			name: dto.name,
			email: dto.email,
			passwordHash,
			emailConfirmed: false,
			emailConfirmationToken,
			emailConfirmationTokenExpiresAt,
			confirmationEmailSentAt: new Date()
		});

		if (dto.inviteToken) {
			await this.linkInviteToUser(dto.inviteToken, user.id, lang);
		}

		await this.mailService.sendEmailConfirmation(user.email, user.name, emailConfirmationToken, lang);

		this.logger.log(`Usuário cadastrado: ${user.email} (id=${user.id})`);

		return genericMessage;
	}

	private async linkInviteToUser(inviteToken: string, userId: string, lang: string) {
		try {
			await this.petsService.acceptInvitation(inviteToken, userId, lang);
		} catch {
			// Token inválido, expirado ou de outro email: cadastro segue normalmente sem vincular o convite.
		}
	}

	async confirmEmail(token: string, lang: string) {
		const user = await this.usersService.findByConfirmationToken(token);
		if (!user) {
			throw new BadRequestException(this.i18n.t('auth.tokenInvalid', { lang }));
		}
		if (
			user.emailConfirmationTokenExpiresAt &&
      user.emailConfirmationTokenExpiresAt.getTime() < Date.now()
		) {
			throw new BadRequestException(this.i18n.t('auth.tokenExpired', { lang }));
		}

		user.emailConfirmed = true;
		user.emailConfirmationToken = null;
		user.emailConfirmationTokenExpiresAt = null;
		await this.usersService.save(user);

		this.logger.log(`Email confirmado: ${user.email} (id=${user.id})`);

		return { message: this.i18n.t('auth.confirmSuccess', { lang }) };
	}

	async resendConfirmation(email: string, lang: string) {
		const user = await this.usersService.findByEmail(email);
		if (!user || user.emailConfirmed) {
			return { message: this.i18n.t('auth.resendGeneric', { lang }) };
		}

		assertEmailCooldownElapsed(user.confirmationEmailSentAt, lang, this.i18n);

		user.emailConfirmationToken = randomUUID();
		user.emailConfirmationTokenExpiresAt = new Date(
			Date.now() + CONFIRMATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
		);
		user.confirmationEmailSentAt = new Date();
		await this.usersService.save(user);
		await this.mailService.sendEmailConfirmation(
			user.email,
			user.name,
			user.emailConfirmationToken,
			lang
		);

		return { message: this.i18n.t('auth.resendGeneric', { lang }) };
	}

	async login(dto: LoginDto, lang: string) {
		const user = await this.usersService.findByEmail(dto.email);
		if (!user) {
			this.logger.warn(`Login falhou (usuário inexistente): ${dto.email}`);
			throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials', { lang }));
		}

		const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
		if (!passwordMatches) {
			this.logger.warn(`Login falhou (senha incorreta): ${dto.email}`);
			throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials', { lang }));
		}

		if (!user.emailConfirmed) {
			this.logger.warn(`Login bloqueado (email não confirmado): ${dto.email}`);
			throw new UnauthorizedException(this.i18n.t('auth.emailNotConfirmed', { lang }));
		}

		const accessToken = await this.jwtService.signAsync({
			sub: user.id,
			email: user.email
		});
		const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);

		this.logger.log(`Login bem-sucedido: ${user.email} (id=${user.id})`);

		return {
			accessToken,
			accessTokenExpiresAt: new Date(exp * 1000),
			user: { id: user.id, name: user.name, email: user.email }
		};
	}

	async forgotPassword(dto: ForgotPasswordDto, lang: string) {
		const genericMessage = { message: this.i18n.t('auth.forgotPasswordGeneric', { lang }) };

		const user = await this.usersService.findByEmail(dto.email);
		if (!user) {
			// Resposta idêntica ao caminho de sucesso para não permitir enumeração de emails cadastrados.
			return genericMessage;
		}

		assertEmailCooldownElapsed(user.passwordResetEmailSentAt, lang, this.i18n);

		user.passwordResetToken = randomUUID();
		user.passwordResetTokenExpiresAt = new Date(
			Date.now() + PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000
		);
		user.passwordResetEmailSentAt = new Date();
		await this.usersService.save(user);

		await this.mailService.sendPasswordReset(user.email, user.name, user.passwordResetToken, lang);

		return genericMessage;
	}

	async resetPassword(dto: ResetPasswordDto, lang: string) {
		const user = await this.usersService.findByPasswordResetToken(dto.token);
		if (!user) {
			throw new BadRequestException(this.i18n.t('auth.passwordResetTokenInvalid', { lang }));
		}
		if (
			user.passwordResetTokenExpiresAt &&
			user.passwordResetTokenExpiresAt.getTime() < Date.now()
		) {
			throw new BadRequestException(this.i18n.t('auth.passwordResetTokenExpired', { lang }));
		}

		user.passwordHash = await bcrypt.hash(dto.password, 12);
		user.passwordResetToken = null;
		user.passwordResetTokenExpiresAt = null;
		await this.usersService.save(user);

		this.logger.log(`Senha redefinida: ${user.email} (id=${user.id})`);

		return { message: this.i18n.t('auth.passwordResetSuccess', { lang }) };
	}
}
