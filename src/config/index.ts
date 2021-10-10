import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (!envFound) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10),

  /**
   * That long string from mlab
   */
  databaseURL: !process.env.MONGODB_USER
    ? process.env.MONGODB_URI
    : `mongodb://${process.env.MONGODB_USER}:${encodeURIComponent(process.env.MONGODB_PASS)}@${
        process.env.MONGODB_HOST
      }:27017/${process.env.MONGODB_DATABASE}?authSource=admin`,

  /**
   * Your secret sauce
   */
  jwtSecret: process.env.JWT_SECRET,

  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },

  /**
   * Agenda.js stuff
   */
  agenda: {
    dbCollection: process.env.AGENDA_DB_COLLECTION,
    pooltime: process.env.AGENDA_POOL_TIME,
    concurrency: parseInt(process.env.AGENDA_CONCURRENCY, 10),
  },

  /**
   * Agendash config
   */
  agendash: {
    user: 'agendash',
    password: '123456',
  },
  /**
   * API configs
   */
  api: {
    prefix: '/api',
  },
  /**
   * Mailgun email credentials
   */
  emails: {
    apiKey: 'API key from mailgun',
    domain: 'Domain Name from mailgun',
  },
  rabbitmq: {
    url: process.env.CLOUDAMQP_URL,
  },
  sequelize: [
    {
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
      port: process.env.AGENDA_DB_COLLECTION || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASS,
    },
  ],
  aws: {
    bucketName: 'media-all-bussiness',
    userKey: 'AKIAJHNUMH2LHZJELZLQ',
    userSecret: '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',
  },
  redis: {
    password: process.env.REDIS_PASSWORD || '',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
};
