import { Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { PetTutor } from '../../pets/entities/pet-tutor.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  	id: string;

  @Column({ unique: true })
  	email: string;

  @Column()
  	name: string;

  @Exclude()
  @Column()
  	passwordHash: string;

  @Column({ default: false })
  	emailConfirmed: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  	emailConfirmationToken: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  	emailConfirmationTokenExpiresAt: Date | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  	confirmationEmailSentAt: Date | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  	passwordResetToken: string | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  	passwordResetTokenExpiresAt: Date | null;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  	passwordResetEmailSentAt: Date | null;

  @OneToMany(() => PetTutor, (petTutor) => petTutor.user)
  	petTutors: PetTutor[];

  @CreateDateColumn({ type: 'timestamptz' })
  	createdAt: Date;
}
