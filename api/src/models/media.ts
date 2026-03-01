import { DataTypes, Model, type Sequelize } from "sequelize";

export class Media extends Model {
  declare id: string;
  declare externalId: string | null;
  declare title: string;
  declare type: string;
  declare mediaClass: string;
  declare releaseDate: Date | null;
  declare countryOfOrigin: string | null;
  declare creators: string[] | null;
  declare coverUrl: string | null;
  declare description: string | null;
  declare attributes: Record<string, unknown> | null;
  declare searchVector: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initMediaModel(sequelize: Sequelize) {
  Media.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: "id",
      },
      externalId: {
        type: DataTypes.TEXT,
        field: "external_id",
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "title",
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "media_type",
      },
      mediaClass: {
        type: DataTypes.TEXT,
        field: "media_class",
      },
      releaseDate: {
        type: DataTypes.DATE,
        field: "release_date",
      },
      countryOfOrigin: {
        type: DataTypes.TEXT,
        field: "country_of_origin",
      },
      creators: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        field: "creators",
      },
      coverUrl: {
        type: DataTypes.TEXT,
        field: "cover_url",
      },
      description: {
        type: DataTypes.TEXT,
        field: "description",
      },
      attributes: {
        type: DataTypes.JSONB,
        field: "attributes",
      },
      searchVector: {
        type: DataTypes.TEXT,
        field: "search_vector",
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
      schema: "media",
      tableName: "media",
      timestamps: true,
    }
  );
}
