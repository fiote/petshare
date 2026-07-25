import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailCooldownTimestamps1784993040308 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "users" ADD "confirmationEmailSentAt" TIMESTAMP WITH TIME ZONE');
		await queryRunner.query('ALTER TABLE "users" ADD "passwordResetEmailSentAt" TIMESTAMP WITH TIME ZONE');
		await queryRunner.query('ALTER TABLE "pet_tutors" ADD "invitationEmailSentAt" TIMESTAMP WITH TIME ZONE');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "pet_tutors" DROP COLUMN "invitationEmailSentAt"');
		await queryRunner.query('ALTER TABLE "users" DROP COLUMN "passwordResetEmailSentAt"');
		await queryRunner.query('ALTER TABLE "users" DROP COLUMN "confirmationEmailSentAt"');
	}

}
