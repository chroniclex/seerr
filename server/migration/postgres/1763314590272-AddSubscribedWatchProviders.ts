import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscribedWatchProviders1763314590272
  implements MigrationInterface
{
  name = 'AddSubscribedWatchProviders1763314590272';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "subscribedWatchProviders" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "subscribedWatchProviders"`
    );
  }
}
