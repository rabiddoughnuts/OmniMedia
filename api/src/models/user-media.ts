import { DataTypes, Model, type Sequelize } from "sequelize";

export class UserMedia extends Model {
  declare userId: string;
  declare mediaId: string;
  declare status: string;
  declare progress: number | null;
  declare rating: number | null;
  declare notes: string | null;
  declare startedAt: Date | null;
  declare completedAt: Date | null;
  declare metaSnapshot: Record<string, unknown> | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initUserMediaModel(sequelize: Sequelize) {
  UserMedia.init(
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        primaryKey: true,
      },
      mediaId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "media_id",
        primaryKey: true,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "status",
      },
      progress: {
        type: DataTypes.INTEGER,
        field: "progress",
      },
      rating: {
        type: DataTypes.FLOAT,
        field: "rating",
      },
      notes: {
        type: DataTypes.TEXT,
        field: "notes",
      },
      startedAt: {
        type: DataTypes.DATE,
        field: "started_at",
      },
      completedAt: {
        type: DataTypes.DATE,
        field: "completed_at",
      },
      metaSnapshot: {
        type: DataTypes.JSONB,
        field: "meta_snapshot",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
      },
    },
    {
      sequelize,
      schema: "interaction",
      tableName: "user_media",
      timestamps: true,
    }
  );
}
