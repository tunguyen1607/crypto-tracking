import { Container } from 'typedi';
import LoggerInstance from './logger';
import agendaFactory from './agenda';
import config from '../config';
import mailgun from 'mailgun-js';

export default ({
  mongoConnection,
  sequelizeConnection,
  producer,
  models,
  publisher,
  awsS3Instance,
  redisInstance,
}: {
  mongoConnection;
  sequelizeConnection;
  producer;
  publisher;
  awsS3Instance: any;
  redisInstance: any;
  models: { name: string; model: any }[];
}) => {
  try {
    models.forEach(m => {
      Container.set(m.name, m.model);
    });

    const agendaInstance = agendaFactory({ mongoConnection });

    Container.set('agendaInstance', agendaInstance);
    Container.set('producerInstance', producer);
    Container.set('publisherInstance', publisher);
    Container.set('awsS3Instance', awsS3Instance);
    Container.set('redisInstance', redisInstance);
    Container.set('logger', LoggerInstance);
    Container.set('emailClient', mailgun({ apiKey: config.emails.apiKey, domain: config.emails.domain }));

    LoggerInstance.info('✌️ Agenda injected into container');

    return { agenda: agendaInstance };
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
