const { Sequelize } = require('sequelize');
require('dotenv').config();

const isRemoteOrSsl =
  Boolean(process.env.DATABASE_URL) ||
  process.env.DB_SSL === 'true' ||
  (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1');

const dialectOptions = isRemoteOrSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions,
      pool: { max: 10, min: 0, idle: 10000 },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions,
        pool: { max: 10, min: 0, idle: 10000 },
      }
    );

module.exports = sequelize;
