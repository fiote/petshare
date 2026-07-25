import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { PetTutor } from '../pets/entities/pet-tutor.entity';
import { CalendarEntry } from '../calendar/entities/calendar-entry.entity';
import { requireEnv } from './require-env';

loadEnv();

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: requireEnv('DB_HOST'),
	port: Number(requireEnv('DB_PORT')),
	username: requireEnv('DB_USERNAME'),
	password: requireEnv('DB_PASSWORD'),
	database: requireEnv('DB_NAME'),
	entities: [User, Pet, PetTutor, CalendarEntry],
	migrations: [__dirname + '/../migrations/*.{js,ts}'],
	synchronize: false
});
