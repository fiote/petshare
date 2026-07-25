import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly i18n: I18nService
	) {}

	findByEmail(email: string): Promise<User | null> {
		return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
	}

	findById(id: string): Promise<User | null> {
		return this.usersRepository.findOne({ where: { id } });
	}

	findByConfirmationToken(token: string): Promise<User | null> {
		return this.usersRepository.findOne({ where: { emailConfirmationToken: token } });
	}

	findByPasswordResetToken(token: string): Promise<User | null> {
		return this.usersRepository.findOne({ where: { passwordResetToken: token } });
	}

	create(data: Partial<User>): Promise<User> {
		const user = this.usersRepository.create({
			...data,
			email: data.email?.toLowerCase()
		});
		return this.usersRepository.save(user);
	}

	save(user: User): Promise<User> {
		return this.usersRepository.save(user);
	}

	async updateName(userId: string, name: string, lang: string): Promise<User> {
		const user = await this.usersRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new NotFoundException(this.i18n.t('users.userNotFound', { lang }));
		}
		user.name = name;
		return this.usersRepository.save(user);
	}
}
