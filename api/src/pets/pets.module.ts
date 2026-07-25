import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetTutor } from './entities/pet-tutor.entity';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PetPhotosController } from './pet-photos.controller';
import { PetPhotoStorageService } from './pet-photo-storage.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
	imports: [TypeOrmModule.forFeature([Pet, PetTutor]), UsersModule, MailModule],
	controllers: [PetsController, PetPhotosController],
	providers: [PetsService, PetPhotoStorageService],
	exports: [PetsService]
})
export class PetsModule {}
