import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { PetTutor } from '../pets/entities/pet-tutor.entity';
import { CalendarEntry } from '../calendar/entities/calendar-entry.entity';

loadEnv();

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST ?? 'localhost',
	port: Number(process.env.DB_PORT ?? 5432),
	username: process.env.DB_USERNAME ?? 'petshare',
	password: process.env.DB_PASSWORD ?? 'petshare',
	database: process.env.DB_NAME ?? 'petshare',
	entities: [User, Pet, PetTutor, CalendarEntry],
	migrations: [__dirname + '/../migrations/*.{js,ts}'],
	synchronize: false
});
