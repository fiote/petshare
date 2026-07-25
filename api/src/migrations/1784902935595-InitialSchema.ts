import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784902935595 implements MigrationInterface {
	name = 'InitialSchema1784902935595';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
		await queryRunner.query('CREATE TABLE "calendar_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "pet_tutor_id" uuid NOT NULL, "date" date NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5e2835bf73f59874b0f6793a4a2" PRIMARY KEY ("id"))');
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_dc45043d4e2758ec946410025a" ON "calendar_entries" ("pet_id", "date") ');
		await queryRunner.query('CREATE TABLE "pets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "species" character varying, "breed" character varying, "photoFilename" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d01e9e7b4ada753c826720bee8b" PRIMARY KEY ("id"))');
		await queryRunner.query('CREATE TYPE "public"."pet_tutors_status_enum" AS ENUM(\'pending\', \'accepted\')');
		await queryRunner.query('CREATE TABLE "pet_tutors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "user_id" uuid, "invitedEmail" character varying, "displayName" character varying, "isManual" boolean NOT NULL DEFAULT false, "status" "public"."pet_tutors_status_enum" NOT NULL DEFAULT \'pending\', "isOwner" boolean NOT NULL DEFAULT false, "invitationToken" character varying, "invitationTokenExpiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9d558f9b8ced3522188c1c181e8" PRIMARY KEY ("id"))');
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_8270f6ac0994646128080b8fcd" ON "pet_tutors" ("pet_id", "invitedEmail") ');
		await queryRunner.query('CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "emailConfirmed" boolean NOT NULL DEFAULT false, "emailConfirmationToken" character varying, "emailConfirmationTokenExpiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))');
		await queryRunner.query('ALTER TABLE "calendar_entries" ADD CONSTRAINT "FK_99f1af9e93a55b08110c197e643" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
		await queryRunner.query('ALTER TABLE "calendar_entries" ADD CONSTRAINT "FK_0af7517d4cf0f07a1f0817a286f" FOREIGN KEY ("pet_tutor_id") REFERENCES "pet_tutors"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
		await queryRunner.query('ALTER TABLE "pet_tutors" ADD CONSTRAINT "FK_eeb4710fefa74ddabbd37b23ece" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
		await queryRunner.query('ALTER TABLE "pet_tutors" ADD CONSTRAINT "FK_c6f5836197349b160a0b307d369" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "pet_tutors" DROP CONSTRAINT "FK_c6f5836197349b160a0b307d369"');
		await queryRunner.query('ALTER TABLE "pet_tutors" DROP CONSTRAINT "FK_eeb4710fefa74ddabbd37b23ece"');
		await queryRunner.query('ALTER TABLE "calendar_entries" DROP CONSTRAINT "FK_0af7517d4cf0f07a1f0817a286f"');
		await queryRunner.query('ALTER TABLE "calendar_entries" DROP CONSTRAINT "FK_99f1af9e93a55b08110c197e643"');
		await queryRunner.query('DROP TABLE "users"');
		await queryRunner.query('DROP INDEX "public"."IDX_8270f6ac0994646128080b8fcd"');
		await queryRunner.query('DROP TABLE "pet_tutors"');
		await queryRunner.query('DROP TYPE "public"."pet_tutors_status_enum"');
		await queryRunner.query('DROP TABLE "pets"');
		await queryRunner.query('DROP INDEX "public"."IDX_dc45043d4e2758ec946410025a"');
		await queryRunner.query('DROP TABLE "calendar_entries"');
	}

}
