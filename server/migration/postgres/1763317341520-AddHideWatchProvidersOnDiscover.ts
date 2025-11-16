import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHideWatchProvidersOnDiscover1763317341520
  implements MigrationInterface
{
  name = 'AddHideWatchProvidersOnDiscover1763317341520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "hideWatchProvidersOnDiscover" boolean DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "hideWatchProvidersOnDiscover"`
    );
  }
}
