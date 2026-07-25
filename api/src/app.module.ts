import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				host: config.get<string>('DB_HOST') ?? 'localhost',
				port: config.get<number>('DB_PORT') ?? 5432,
				username: config.get<string>('DB_USERNAME') ?? 'petshare',
				password: config.get<string>('DB_PASSWORD') ?? 'petshare',
				database: config.get<string>('DB_NAME') ?? 'petshare',
				entities: [User, Pet, PetTutor, CalendarEntry],
				synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
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
export class AppModule {}
