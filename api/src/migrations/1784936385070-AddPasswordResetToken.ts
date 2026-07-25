import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetToken1784936385070 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "users" ADD "passwordResetToken" character varying');
		await queryRunner.query('ALTER TABLE "users" ADD "passwordResetTokenExpiresAt" TIMESTAMP WITH TIME ZONE');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "users" DROP COLUMN "passwordResetTokenExpiresAt"');
		await queryRunner.query('ALTER TABLE "users" DROP COLUMN "passwordResetToken"');
	}

}
