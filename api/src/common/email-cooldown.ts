import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export const EMAIL_COOLDOWN_SECONDS = 60;

export function assertEmailCooldownElapsed(
	lastSentAt: Date | null,
	lang: string,
	i18n: I18nService
): void {
	if (!lastSentAt) {
		return;
	}

	const elapsedMs = Date.now() - lastSentAt.getTime();
	const remainingSeconds = Math.ceil((EMAIL_COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000);

	if (remainingSeconds > 0) {
		throw new HttpException(
			i18n.t('common.emailCooldown', { lang, args: { seconds: remainingSeconds } }),
			HttpStatus.TOO_MANY_REQUESTS
		);
	}
}
