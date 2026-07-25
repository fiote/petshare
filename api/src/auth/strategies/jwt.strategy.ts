import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { AUTH_COOKIE_NAME } from '../auth-cookie';

function extractFromCookie(req: Request): string | null {
	return req.cookies?.[AUTH_COOKIE_NAME] ?? null;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		config: ConfigService,
    private readonly usersService: UsersService
	) {
		const secret = config.get<string>('JWT_SECRET');
		if (!secret) {
			throw new Error('JWT_SECRET não configurado. Defina uma variável de ambiente forte e aleatória.');
		}
		super({
			jwtFromRequest: extractFromCookie,
			ignoreExpiration: false,
			secretOrKey: secret
		});
	}

	async validate(payload: JwtPayload) {
		const user = await this.usersService.findById(payload.sub);
		if (!user || !user.emailConfirmed) {
			throw new UnauthorizedException();
		}
		return { userId: user.id, email: user.email, name: user.name };
	}
}
