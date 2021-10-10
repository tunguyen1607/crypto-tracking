import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import sequelizeLoader from './sequelize';
import jobsLoader from './jobs';
import consumersLoader from './consumers';
import producerLoader from './producer';
import rabbitMQLoader from './rabbitmq';
import publisherLoader from './publisher';
import workers from './workers';
import Logger from './logger';

import awsS3 from './aws';
import redis from './redis';
//We have to import at least all the events once so they can be triggered
import './events';

export default async ({ expressApp, cronjob = true, rabbitmq = true, kafka = true }) => {
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
  const campaignModel = {
    name: 'campaignModel',
    model: await require('../models/campaign').default({ sequelize: sequelizeConnection }),
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
      campaignModel,
      // salaryModel,
      // whateverModel
    ],
  });
  Logger.info('✌️ Dependency Injector loaded');
  if (kafka) {
    await consumersLoader();
    Logger.info('✌️ Consumers loaded');
  }
  if (rabbitmq) {
    await workers({ amqpConn: rabbitmqConnection });
    Logger.info('✌️ Workers loaded');
  }

  if (cronjob) {
    await jobsLoader({ agenda });
    Logger.info('✌️ Jobs loaded');
  }
  if (expressApp) {
    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');
  }
};
