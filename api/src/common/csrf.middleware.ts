import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const CSRF_COOKIE_NAME = 'petshare_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function tokensMatch(a: string, b: string): boolean {
	const bufferA = Buffer.from(a);
	const bufferB = Buffer.from(b);
	return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction): void {
		let cookieToken: string | undefined = req.cookies?.[CSRF_COOKIE_NAME];
		if (!cookieToken) {
			cookieToken = randomUUID();
			res.cookie(CSRF_COOKIE_NAME, cookieToken, {
				httpOnly: false,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/'
			});
		}

		if (!SAFE_METHODS.has(req.method)) {
			const headerToken = req.header(CSRF_HEADER_NAME);
			if (!headerToken || !tokensMatch(headerToken, cookieToken)) {
				throw new ForbiddenException('CSRF token inválido ou ausente.');
			}
		}

		next();
	}
}
