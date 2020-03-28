import amqp from 'amqplib/callback_api';
import LoggerInstance from './logger';
import config from '../config';

const tryConnect = 0;

const createConnection = async function(): Promise<amqp.Connection> {
  return new Promise(function(resolve, reject) {
    amqp.connect(config.rabbitmq.url + '?heartbeat=60', async function(err, conn) {
      if (err) {
        LoggerInstance.error('[AMQP]', err.message);
        if (tryConnect < 4) {
          await createConnection();
        } else {
          reject(err);
        }
      }
      conn.on('error', async function(err) {
        if (err.message !== 'Connection closing') {
          LoggerInstance.error('[AMQP] conn error', err.message);
          if (tryConnect < 4) {
            await createConnection();
          } else {
            reject(err);
          }
        }
      });
      conn.on('close', async function() {
        reject(new Error('[AMQP] connection close!'));
        if (tryConnect < 4) {
          await createConnection();
        } else {
          reject(err);
        }
      });
      LoggerInstance.info('[AMQP] connected');
      return resolve(conn);
    });
  });
}

export default async (): Promise<amqp.Connection> => {
  return await createConnection();
};
