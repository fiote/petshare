import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PetsModule } from '../pets/pets.module';

@Module({
	imports: [
		UsersModule,
		MailModule,
		PassportModule,
		PetsModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const secret = config.get<string>('JWT_SECRET');
				if (!secret) {
					throw new Error('JWT_SECRET não configurado. Defina uma variável de ambiente forte e aleatória.');
				}
				return {
					secret,
					signOptions: {
						expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '1d') as unknown as number
					}
				};
			}
		})
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService]
})
export class AuthModule {}
