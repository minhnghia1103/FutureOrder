import { Sequelize } from "sequelize-typescript";
import * as dotenv from "dotenv";
import { Dialect } from "sequelize";
import { resolve } from "path";

dotenv.config();

const connection = new Sequelize({
    dialect: process.env.DIALECT as Dialect,
    host: process.env.HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: process.env.LOGGING === "true" ? true : false,
    models: [resolve(__dirname, "../entity/*.ts")]
});

export default connection;