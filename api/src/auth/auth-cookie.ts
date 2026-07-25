import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'petshare_token';

function cookieOptions(maxAgeMs?: number): CookieOptions {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {})
	};
}

export function setAuthCookie(res: Response, token: string, expiresAt: Date): void {
	const maxAgeMs = Math.max(0, expiresAt.getTime() - Date.now());
	res.cookie(AUTH_COOKIE_NAME, token, cookieOptions(maxAgeMs));
}

export function clearAuthCookie(res: Response): void {
	res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}
