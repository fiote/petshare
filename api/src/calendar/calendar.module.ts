import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEntry } from './entities/calendar-entry.entity';
import { PetTutor } from '../pets/entities/pet-tutor.entity';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { PetsModule } from '../pets/pets.module';

@Module({
	imports: [TypeOrmModule.forFeature([CalendarEntry, PetTutor]), PetsModule],
	controllers: [CalendarController],
	providers: [CalendarService]
})
export class CalendarModule {}
