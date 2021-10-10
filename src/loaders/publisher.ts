import amqp from 'amqplib/callback_api';
import LoggerInstance from './logger';

export default ({ amqpConn }: { amqpConn: amqp.Connection }): Promise<amqp.Channel> => {
  return new Promise(function(resolve, reject) {
    amqpConn.createConfirmChannel(function(err, ch) {
      ch.on('error', function(err) {
        LoggerInstance.error('[AMQP] channel error', err.message);
        process.exit(0);
        reject(err);
      });
      ch.on('close', function() {
        LoggerInstance.warn('[AMQP] channel closed');
        process.exit(0);
      });
      return resolve(ch);
    });
  });
};
