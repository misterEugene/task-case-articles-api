import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTypoInCreatedAt1757932773000 implements MigrationInterface {
    name = 'FixTypoInCreatedAt1757932773000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename column from 'craeted_at' to 'created_at'
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "craeted_at" TO "created_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: rename column back from 'created_at' to 'craeted_at'
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "created_at" TO "craeted_at"`);
    }
}