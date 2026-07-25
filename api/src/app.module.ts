import { join } from 'path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { CalendarModule } from './calendar/calendar.module';
import { MailModule } from './mail/mail.module';
import { User } from './users/entities/user.entity';
import { Pet } from './pets/entities/pet.entity';
import { PetTutor } from './pets/entities/pet-tutor.entity';
import { CalendarEntry } from './calendar/entities/calendar-entry.entity';
import { requireEnv } from './config/require-env';
import { CsrfMiddleware } from './common/csrf.middleware';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ThrottlerModule.forRoot([
			{
				ttl: 60_000,
				limit: 30
			}
		]),
		I18nModule.forRoot({
			fallbackLanguage: 'en',
			loaderOptions: {
				path: join(__dirname, '/i18n/'),
				watch: true
			},
			resolvers: [AcceptLanguageResolver]
		}),
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: 'postgres',
				host: requireEnv('DB_HOST'),
				port: Number(requireEnv('DB_PORT')),
				username: requireEnv('DB_USERNAME'),
				password: requireEnv('DB_PASSWORD'),
				database: requireEnv('DB_NAME'),
				entities: [User, Pet, PetTutor, CalendarEntry],
				synchronize: process.env.DB_SYNCHRONIZE === 'true',
				autoLoadEntities: true
			})
		}),
		AuthModule,
		UsersModule,
		PetsModule,
		CalendarModule,
		MailModule
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		}
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(CsrfMiddleware).forRoutes('*');
	}
}
