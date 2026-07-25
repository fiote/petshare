import { Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn } from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { PetTutor } from '../../pets/entities/pet-tutor.entity';

@Entity('calendar_entries')
@Index(['pet', 'date'], { unique: true })
export class CalendarEntry {
  @PrimaryGeneratedColumn('uuid')
  	id: string;

  @ManyToOne(() => Pet, (pet) => pet.calendarEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  	pet: Pet;

  @Column({ name: 'pet_id' })
  	petId: string;

  @ManyToOne(() => PetTutor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_tutor_id' })
  	petTutor: PetTutor;

  @Column({ name: 'pet_tutor_id' })
  	petTutorId: string;

  @Column({ type: 'date' })
  	date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  	createdAt: Date;
}
