import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import sequelizeLoader from './sequelize';
import jobsLoader from './jobs';
import consumersLoader from './consumers';
import producerLoader from './producer';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered
import './events';

export default async ({ expressApp }) => {
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

  const userModel = {
    name: 'userModel',
    // Notice the require syntax and the '.default'
    model: require('../models/user').default,
  };
  const campaignModel = {
    name: 'campaignModel',
    model: await require('../models/campaign').default({ sequelize: sequelizeConnection }),
  }
  let producer = await producerLoader();
  Logger.info('✌️ Producer loaded');
  // It returns the agenda instance because it's needed in the subsequent loaders
  const { agenda } = await dependencyInjectorLoader({
    mongoConnection,
    sequelizeConnection,
    producer,
    models: [
      userModel,
      campaignModel,
      // salaryModel,
      // whateverModel
    ],
  });
  Logger.info('✌️ Dependency Injector loaded');
  await consumersLoader();
  Logger.info('✌️ Consumers loaded');

  await jobsLoader({ agenda });
  Logger.info('✌️ Jobs loaded');
  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
