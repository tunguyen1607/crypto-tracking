import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import sequelizeLoader from './sequelize';
import jobsLoader from './jobs';
import consumersLoader from './consumers';
import producerLoader from './producer';
import rabbitMQLoader from './rabbitmq';
import publisherLoader from './publisher';
import bullJobsLoader from './bullJobs';
import workers from './workers';
import Logger from './logger';

import awsS3 from './aws';
import redis from './redis';
//We have to import at least all the events once so they can be triggered
import './events';

export default async ({
  expressApp,
  cronjob = false,
  rabbitmq = false,
  kafka = false,
  consumer = false,
  worker = false,
  longJob = false,
}) => {
  const mongoConnection = await mongooseLoader();
  const sequelizeConnection = await sequelizeLoader();
  Logger.info('✌️ DB loaded and connected!');

  /**
   * WTF is going on here?
   *
   * We are injecting the mongoose models into the DI container.
   * I know this is controversial but will provide a lot of flexibility at the time
   * of writing unit tests, just go and check how beautiful they are!
   */
  let producer = null;
  if (kafka) {
    producer = await producerLoader();
    Logger.info('✌️ Producer loaded');
  }
  let publisher = null;
  let rabbitmqConnection = null;
  if (rabbitmq) {
    rabbitmqConnection = await rabbitMQLoader();
    Logger.info('✌️ RabbitMQ loaded and connected!');
    publisher = await publisherLoader({ amqpConn: rabbitmqConnection });
  }

  const awsS3Instance = await awsS3();
  const redisInstance = await redis();

  const userModel = {
    name: 'userModel',
    // Notice the require syntax and the '.default'
    model: require('../models/user').default,
  };
  const stockModel = {
    name: 'stockModel',
    model: await require('../models/Stock').default({ sequelize: sequelizeConnection }),
  };

  const cryptoModel = {
    name: 'cryptoModel',
    model: await require('../models/Crypto').default({ sequelize: sequelizeConnection }),
  };

  const cryptoMarketModel = {
    name: 'cryptoMarketModel',
    model: await require('../models/CryptoMarket').default({ sequelize: sequelizeConnection }),
  };

  const cryptoHistoricalModel = {
    name: 'cryptoHistoricalModel',
    model: await require('../models/CryptoHistorical').default({ sequelize: sequelizeConnection }),
  };

  const cryptoHistoricalTimeModel = {
    name: 'cryptoHistoricalTimeModel',
    model: await require('../models/CryptoHistoricalTime').default({ sequelize: sequelizeConnection }),
  };

  const cryptoCategoryModel = {
    name: 'cryptoCategoryModel',
    model: await require('../models/CryptoCategory').default({ sequelize: sequelizeConnection }),
  };

  const cryptoCategoryItemModel = {
    name: 'cryptoCategoryItemModel',
    model: await require('../models/CryptoCategoryItem').default({ sequelize: sequelizeConnection }),
  };

  const currencyModel = {
    name: 'currencyModel',
    model: await require('../models/Currency').default({ sequelize: sequelizeConnection }),
  };
  let queues:any = [];
  let serverAdapter:any = null;
  if(longJob){
    let bull:any = await bullJobsLoader();
    queues = bull.queues;
    serverAdapter = bull.serverAdapter;
  }

  // It returns the agenda instance because it's needed in the subsequent loaders
  const { agenda } = await dependencyInjectorLoader({
    mongoConnection,
    sequelizeConnection,
    awsS3Instance,
    publisher,
    producer,
    redisInstance,
    models: [
      userModel,
      stockModel,
      cryptoModel,
      cryptoMarketModel,
      cryptoHistoricalModel,
      cryptoHistoricalTimeModel,
      cryptoCategoryModel,
      cryptoCategoryItemModel,
      currencyModel,
      // salaryModel,
      // whateverModel
    ],
    queues,
  });

  Logger.info('✌️ Dependency Injector loaded');
  if (kafka && consumer) {
    await consumersLoader();
    Logger.info('✌️ Consumers loaded');
  }
  if (rabbitmq && worker) {
    await workers({ amqpConn: rabbitmqConnection });
    Logger.info('✌️ Workers loaded');
  }

  if (cronjob) {
    await jobsLoader({ agenda });
    Logger.info('✌️ Jobs loaded');
  }

  if (expressApp) {
    await expressLoader({ app: expressApp, serverAdapter });
    Logger.info('✌️ Express loaded');
  }
};
