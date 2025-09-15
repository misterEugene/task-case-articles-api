import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const createDataSourceOptions = (): DataSourceOptions => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    entities: [`dist/**/*.entity.js`],
    migrations: [`dist/db/migrations/*.js`],
    logging: true,
  };
};

const dataSource = new DataSource(createDataSourceOptions());

export default dataSource;
