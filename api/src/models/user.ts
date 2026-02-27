import { DataTypes, Model, type Sequelize } from "sequelize";

export class User extends Model {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare createdAt: Date;
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: "id",
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "email",
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "password_hash",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
    },
    {
      sequelize,
      schema: "users",
      tableName: "users",
      timestamps: false,
    }
  );
}
