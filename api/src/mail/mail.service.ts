import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Resend } from 'resend';

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);
	private readonly fromEmail: string;
	private readonly webBaseUrl: string;
	private readonly resend: Resend | null;

	constructor(
    private readonly config: ConfigService,
    private readonly i18n: I18nService
	) {
		const apiKey = this.config.get<string>('RESEND_API_KEY');
		this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL') ?? 'no-reply@petshare.local';
		this.webBaseUrl = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:5000';

		if (apiKey) {
			this.resend = new Resend(apiKey);
		} else {
			this.resend = null;
			this.logger.warn(
				'RESEND_API_KEY não configurada — emails serão apenas logados, não enviados.'
			);
		}
	}

	async sendEmailConfirmation(
		to: string,
		name: string,
		token: string,
		lang: string
	): Promise<void> {
		const confirmUrl = `${this.webBaseUrl}/confirm-email?token=${token}`;
		await this.send({
			to,
			subject: this.i18n.t('mail.confirmation.subject', { lang }),
			html: `
        <p>${this.i18n.t('mail.confirmation.greeting', { lang, args: { name: escapeHtml(name) } })}</p>
        <p>${this.i18n.t('mail.confirmation.body', { lang })}</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>${this.i18n.t('mail.confirmation.ignoreNotice', { lang })}</p>
      `
		});
	}

	async sendTutorInvitation(
		to: string,
		petName: string,
		inviterName: string,
		token: string,
		recipientHasAccount: boolean,
		lang: string
	): Promise<void> {
		const inviteUrl = recipientHasAccount
			? `${this.webBaseUrl}/invitations/${token}`
			: `${this.webBaseUrl}/register?inviteToken=${token}`;

		await this.send({
			to,
			subject: this.i18n.t('mail.invitation.subject', {
				lang,
				args: { inviterName, petName }
			}),
			html: `
        <p>${this.i18n.t('mail.invitation.greeting', { lang })}</p>
        <p>${this.i18n.t('mail.invitation.body', {
		lang,
		args: { inviterName: escapeHtml(inviterName), petName: escapeHtml(petName) }
	})}</p>
        <p><a href="${inviteUrl}">${this.i18n.t('mail.invitation.cta', { lang })}</a></p>
      `
		});
	}

	async sendPasswordReset(
		to: string,
		name: string,
		token: string,
		lang: string
	): Promise<void> {
		const resetUrl = `${this.webBaseUrl}/reset-password?token=${token}`;
		await this.send({
			to,
			subject: this.i18n.t('mail.passwordReset.subject', { lang }),
			html: `
        <p>${this.i18n.t('mail.passwordReset.greeting', { lang, args: { name: escapeHtml(name) } })}</p>
        <p>${this.i18n.t('mail.passwordReset.body', { lang })}</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>${this.i18n.t('mail.passwordReset.ignoreNotice', { lang })}</p>
      `
		});
	}

	private async send(msg: { to: string; subject: string; html: string }): Promise<void> {
		if (!this.resend) {
			this.logger.log(`[email simulado] Para: ${msg.to} | Assunto: ${msg.subject}`);
			return;
		}

		const { error } = await this.resend.emails.send({
			to: msg.to,
			from: this.fromEmail,
			subject: msg.subject,
			html: msg.html
		});

		if (error) {
			this.logger.error(`Falha ao enviar email para ${msg.to}: ${error.message}`);
			throw new Error(`Falha ao enviar email via Resend: ${error.message}`);
		}

		this.logger.log(`Email enviado para ${msg.to} | Assunto: ${msg.subject}`);
	}
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
