import { Sequelize } from "sequelize";
import { initMediaModel } from "./media.js";
import { initUserModel } from "./user.js";
import { initUserMediaModel } from "./user-media.js";

let sequelize: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (!sequelize) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    sequelize = new Sequelize(connectionString, {
      logging: false,
    });

    initModels(sequelize);
  }

  return sequelize;
}

export function initModels(instance: Sequelize) {
  initMediaModel(instance);
  initUserModel(instance);
  initUserMediaModel(instance);
}
