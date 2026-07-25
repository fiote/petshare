import { BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import { Pet } from './entities/pet.entity';
import { PetTutor, PetTutorStatus } from './entities/pet-tutor.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PetPhotoStorageService } from './pet-photo-storage.service';
import { assertEmailCooldownElapsed } from '../common/email-cooldown';

const INVITATION_TOKEN_TTL_DAYS = 14;

@Injectable()
export class PetsService {
	constructor(
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(PetTutor)
    private readonly petTutorsRepository: Repository<PetTutor>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly photoStorage: PetPhotoStorageService,
    private readonly i18n: I18nService
	) {}

	async createPet(ownerId: string, dto: CreatePetDto, lang: string): Promise<Pet> {
		const owner = await this.usersService.findById(ownerId);
		if (!owner) {
			throw new NotFoundException(this.i18n.t('pets.userNotFound', { lang }));
		}

		const pet = await this.petsRepository.save(
			this.petsRepository.create({
				name: dto.name,
				species: dto.species ?? null,
				breed: dto.breed ?? null
			})
		);

		await this.petTutorsRepository.save(
			this.petTutorsRepository.create({
				petId: pet.id,
				userId: owner.id,
				invitedEmail: owner.email,
				status: PetTutorStatus.ACCEPTED,
				isOwner: true
			})
		);

		return pet;
	}

	async listPetsForUser(userId: string): Promise<Pet[]> {
		const petTutors = await this.petTutorsRepository.find({
			where: { userId, status: PetTutorStatus.ACCEPTED },
			relations: { pet: true }
		});
		return petTutors.map((pt) => pt.pet);
	}

	async getPetTutors(petId: string): Promise<PetTutor[]> {
		return this.petTutorsRepository.find({
			where: { petId },
			relations: { user: true },
			order: { createdAt: 'ASC' }
		});
	}

	async assertUserIsTutor(petId: string, userId: string, lang: string): Promise<PetTutor> {
		const petTutor = await this.petTutorsRepository.findOne({
			where: { petId, userId, status: PetTutorStatus.ACCEPTED }
		});
		if (!petTutor) {
			throw new ForbiddenException(this.i18n.t('pets.forbiddenNoAccess', { lang }));
		}
		return petTutor;
	}

	async getPetOrFail(petId: string, lang: string): Promise<Pet> {
		const pet = await this.petsRepository.findOne({ where: { id: petId } });
		if (!pet) {
			throw new NotFoundException(this.i18n.t('pets.petNotFound', { lang }));
		}
		return pet;
	}

	async assertPetTutorBelongsToPet(
		petId: string,
		petTutorId: string,
		lang: string
	): Promise<PetTutor> {
		const petTutor = await this.petTutorsRepository.findOne({
			where: { id: petTutorId, petId, status: PetTutorStatus.ACCEPTED }
		});
		if (!petTutor) {
			throw new NotFoundException(this.i18n.t('pets.tutorNotFoundForPet', { lang }));
		}
		return petTutor;
	}

	async updatePetPhoto(
		petId: string,
		userId: string,
		file: { originalname: string; buffer: Buffer },
		lang: string
	): Promise<Pet> {
		await this.assertUserIsTutor(petId, userId, lang);
		const pet = await this.getPetOrFail(petId, lang);

		const filename = this.photoStorage.buildFilename(file.buffer, lang);
		await writeFile(this.photoStorage.resolvePath(filename), file.buffer);

		const previousFilename = pet.photoFilename;
		pet.photoFilename = filename;
		await this.petsRepository.save(pet);

		if (previousFilename) {
			this.photoStorage.deletePhoto(previousFilename);
		}

		return pet;
	}

	resolvePhotoPath(filename: string): string {
		return this.photoStorage.resolvePath(filename);
	}

	async deletePet(petId: string, userId: string, lang: string): Promise<void> {
		const requesterTutor = await this.petTutorsRepository.findOne({
			where: { petId, userId, status: PetTutorStatus.ACCEPTED }
		});
		if (!requesterTutor?.isOwner) {
			throw new ForbiddenException(this.i18n.t('pets.forbiddenOwnerOnly', { lang }));
		}

		const pet = await this.getPetOrFail(petId, lang);
		await this.petsRepository.remove(pet);

		if (pet.photoFilename) {
			this.photoStorage.deletePhoto(pet.photoFilename);
		}
	}

	async createManualTutor(
		petId: string,
		creatorId: string,
		name: string,
		lang: string,
		email?: string
	): Promise<PetTutor> {
		await this.assertUserIsTutor(petId, creatorId, lang);
		const normalizedEmail = email ? email.toLowerCase() : null;

		if (normalizedEmail) {
			const existing = await this.petTutorsRepository.findOne({
				where: { petId, invitedEmail: normalizedEmail }
			});
			if (existing) {
				throw new ConflictException(this.i18n.t('pets.conflictAlreadyTutorEmail', { lang }));
			}
		}

		return this.petTutorsRepository.save(
			this.petTutorsRepository.create({
				petId,
				userId: null,
				invitedEmail: normalizedEmail,
				displayName: name,
				isManual: true,
				status: PetTutorStatus.ACCEPTED,
				isOwner: false
			})
		);
	}

	async inviteTutor(petId: string, inviterId: string, email: string, lang: string) {
		await this.assertUserIsTutor(petId, inviterId, lang);
		const pet = await this.getPetOrFail(petId, lang);
		const normalizedEmail = email.toLowerCase();

		const existingInvite = await this.petTutorsRepository.findOne({
			where: { petId, invitedEmail: normalizedEmail }
		});
		if (existingInvite) {
			if (existingInvite.status === PetTutorStatus.ACCEPTED) {
				throw new ConflictException(this.i18n.t('pets.conflictAlreadyTutor', { lang }));
			}
			throw new ConflictException(this.i18n.t('pets.conflictPendingInvite', { lang }));
		}

		const lastInviteToEmail = await this.petTutorsRepository.findOne({
			where: { invitedEmail: normalizedEmail },
			order: { invitationEmailSentAt: 'DESC' }
		});
		assertEmailCooldownElapsed(lastInviteToEmail?.invitationEmailSentAt ?? null, lang, this.i18n);

		const invitedUser = await this.usersService.findByEmail(normalizedEmail);
		const invitationToken = randomUUID();

		const petTutor = await this.petTutorsRepository.save(
			this.petTutorsRepository.create({
				petId,
				userId: invitedUser?.id ?? null,
				invitedEmail: normalizedEmail,
				status: PetTutorStatus.PENDING,
				isOwner: false,
				invitationToken,
				invitationTokenExpiresAt: new Date(
					Date.now() + INVITATION_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
				),
				invitationEmailSentAt: new Date()
			})
		);

		const inviter = await this.usersService.findById(inviterId);

		await this.mailService.sendTutorInvitation(
			normalizedEmail,
			pet.name,
			inviter?.name ?? this.i18n.t('common.unknownTutorName', { lang }),
			invitationToken,
			Boolean(invitedUser),
			lang
		);

		return petTutor;
	}

	async acceptInvitation(token: string, userId: string, lang: string) {
		const invite = await this.petTutorsRepository.findOne({ where: { invitationToken: token } });
		if (!invite) {
			throw new NotFoundException(this.i18n.t('pets.inviteInvalidOrUsed', { lang }));
		}

		return this.finalizeInvitationAcceptance(invite, userId, lang);
	}

	async acceptInvitationById(invitationId: string, userId: string, lang: string) {
		const invite = await this.petTutorsRepository.findOne({ where: { id: invitationId } });
		if (!invite || invite.status !== PetTutorStatus.PENDING) {
			throw new NotFoundException(this.i18n.t('pets.inviteInvalidOrUsed', { lang }));
		}

		return this.finalizeInvitationAcceptance(invite, userId, lang);
	}

	private async finalizeInvitationAcceptance(invite: PetTutor, userId: string, lang: string) {
		if (
			invite.invitationTokenExpiresAt &&
      invite.invitationTokenExpiresAt.getTime() < Date.now()
		) {
			throw new BadRequestException(this.i18n.t('pets.inviteExpired', { lang }));
		}

		const user = await this.usersService.findById(userId);
		if (!user || !invite.invitedEmail || user.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
			throw new ForbiddenException(this.i18n.t('pets.forbiddenInviteNotYours', { lang }));
		}

		invite.userId = user.id;
		invite.status = PetTutorStatus.ACCEPTED;
		invite.invitationToken = null;
		invite.invitationTokenExpiresAt = null;
		return this.petTutorsRepository.save(invite);
	}

	async listPendingInvitationsForUser(email: string) {
		return this.petTutorsRepository.find({
			where: { invitedEmail: email.toLowerCase(), status: PetTutorStatus.PENDING },
			relations: { pet: true }
		});
	}
}
