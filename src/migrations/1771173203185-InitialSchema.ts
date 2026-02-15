import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771173203185 implements MigrationInterface {
    name = 'InitialSchema1771173203185'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."contact_requests_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "contact_requests" ("id" SERIAL NOT NULL, "sessionId" character varying NOT NULL, "name" character varying, "phone" character varying, "email" character varying, "contactDate" character varying, "message" character varying, "status" "public"."contact_requests_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fead2ef7e2fd83be371d19ab1c3" UNIQUE ("sessionId"), CONSTRAINT "PK_5fc5cfa569e4e66051c6acde3b9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "contact_requests"`);
        await queryRunner.query(`DROP TYPE "public"."contact_requests_status_enum"`);
    }

}
