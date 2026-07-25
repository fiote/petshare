import { Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Pet } from './pet.entity';
import { User } from '../../users/entities/user.entity';

export enum PetTutorStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}

@Entity('pet_tutors')
@Index(['pet', 'invitedEmail'], { unique: true })
export class PetTutor {
  @PrimaryGeneratedColumn('uuid')
  	id: string;

  @ManyToOne(() => Pet, (pet) => pet.petTutors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  	pet: Pet;

  @Column({ name: 'pet_id' })
  	petId: string;

  @ManyToOne(() => User, (user) => user.petTutors, {
  	onDelete: 'CASCADE',
  	nullable: true
  })
  @JoinColumn({ name: 'user_id' })
  	user: User | null;

  @Column({ name: 'user_id', nullable: true })
  	userId: string | null;

  @Column({ type: 'varchar', nullable: true })
  	invitedEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  	displayName: string | null;

  @Column({ default: false })
  	isManual: boolean;

  @Column({ type: 'enum', enum: PetTutorStatus, default: PetTutorStatus.PENDING })
  	status: PetTutorStatus;

  @Column({ default: false })
  	isOwner: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  	invitationToken: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  	invitationTokenExpiresAt: Date | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  	invitationEmailSentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  	createdAt: Date;

  @Expose()
  get displayLabel(): string {
  	return this.user?.name ?? this.displayName ?? this.invitedEmail ?? 'Tutor';
  }
}
