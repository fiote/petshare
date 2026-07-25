import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CalendarEntry } from './entities/calendar-entry.entity';
import { PetTutor, PetTutorStatus } from '../pets/entities/pet-tutor.entity';

export const STATS_WINDOWS = [7, 15, 30, 90] as const;

function toDateOnly(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function todayDateOnly(): string {
	return toDateOnly(new Date());
}

function addDays(dateOnly: string, days: number): string {
	const d = new Date(`${dateOnly}T00:00:00.000Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return toDateOnly(d);
}

function daysBetween(fromDate: string, toDate: string): number {
	return Math.round(
		(Date.parse(`${toDate}T00:00:00.000Z`) - Date.parse(`${fromDate}T00:00:00.000Z`)) / 86_400_000
	);
}

/** Para uma janela de N dias centrada em hoje, retorna quantos dias ficam antes e depois. */
function windowSpread(windowSize: number): { before: number; after: number } {
	const remaining = windowSize - 1;
	const after = Math.floor(remaining / 2);
	const before = remaining - after;
	return { before, after };
}

@Injectable()
export class CalendarService {
	constructor(
    @InjectRepository(CalendarEntry)
    private readonly calendarRepository: Repository<CalendarEntry>,
    @InjectRepository(PetTutor)
    private readonly petTutorsRepository: Repository<PetTutor>
	) {}

	async setDay(petId: string, petTutorId: string, date: string): Promise<CalendarEntry> {
		let entry = await this.calendarRepository.findOne({ where: { petId, date } });
		if (entry) {
			entry.petTutorId = petTutorId;
			return this.calendarRepository.save(entry);
		}

		entry = this.calendarRepository.create({ petId, petTutorId, date });
		return this.calendarRepository.save(entry);
	}

	async clearDay(petId: string, date: string): Promise<void> {
		await this.calendarRepository.delete({ petId, date });
	}

	async listEntriesInRange(
		petId: string,
		fromDate: string,
		toDate: string
	): Promise<CalendarEntry[]> {
		return this.calendarRepository.find({
			where: { petId, date: Between(fromDate, toDate) },
			relations: { petTutor: { user: true } },
			order: { date: 'ASC' }
		});
	}

	async getStats(petId: string, today: string = todayDateOnly()) {
		const tutors = await this.petTutorsRepository.find({
			where: { petId, status: PetTutorStatus.ACCEPTED },
			relations: { user: true }
		});

		const allEntries = await this.calendarRepository.find({ where: { petId } });

		const tutorName = (tutor: PetTutor) =>
			tutor.user?.name ?? tutor.displayName ?? tutor.invitedEmail ?? 'Tutor';

		const buildWindow = (
			windowSize: number | null,
			isTotal: boolean,
			from: string,
			to: string,
			totalDays: number
		) => {
			const counts = tutors
				.map((tutor) => ({
					petTutorId: tutor.id,
					tutorName: tutorName(tutor),
					count: allEntries.filter(
						(e) => e.petTutorId === tutor.id && e.date >= from && e.date <= to
					).length
				}))
				.filter((c) => c.count > 0);

			const isComplete = counts.reduce((sum, c) => sum + c.count, 0) >= totalDays;

			return { windowSize, isTotal, totalDays, counts, isComplete };
		};

		const fixedWindows = STATS_WINDOWS.map((windowSize) => {
			const { before, after } = windowSpread(windowSize);
			const from = addDays(today, -before);
			const to = addDays(today, after);
			return buildWindow(windowSize, false, from, to, before + after + 1);
		});

		const windows = [...fixedWindows];
		if (allEntries.length > 0) {
			const dates = allEntries.map((e) => e.date).sort();
			const from = dates[0];
			const to = dates[dates.length - 1];
			windows.push(buildWindow(null, true, from, to, daysBetween(from, to) + 1));
		}

		return windows.filter((w) => w.isComplete);
	}
}
