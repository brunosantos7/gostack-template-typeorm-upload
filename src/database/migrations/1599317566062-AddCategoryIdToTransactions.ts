import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export default class AddCategoryIdToTransactions1599317566062 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn("transaction", new TableColumn({
      name: "category_id",
      type: "uuid",
      isNullable: true
    }));


    await queryRunner.createForeignKey("transaction", new TableForeignKey({
      name: "transaction_category_id",
      columnNames: ["category_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "category",
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("transaction", "transaction_category_id");
    await queryRunner.dropColumn("transaction", "category_id");
  }

}
