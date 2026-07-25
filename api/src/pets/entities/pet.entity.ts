import { Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { PetTutor } from './pet-tutor.entity';
import { CalendarEntry } from '../../calendar/entities/calendar-entry.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  	id: string;

  @Column()
  	name: string;

  @Column({ type: 'varchar', nullable: true })
  	species: string | null;

  @Column({ type: 'varchar', nullable: true })
  	breed: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  	photoFilename: string | null;

  @Expose()
  get photoUrl(): string | null {
  	return this.photoFilename ? `/api/pets/photos/${this.photoFilename}` : null;
  }

  @OneToMany(() => PetTutor, (petTutor) => petTutor.pet)
  	petTutors: PetTutor[];

  @OneToMany(() => CalendarEntry, (entry) => entry.pet)
  	calendarEntries: CalendarEntry[];

  @CreateDateColumn({ type: 'timestamptz' })
  	createdAt: Date;
}
