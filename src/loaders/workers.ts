import amqp from 'amqplib/callback_api';
import LoggerInstance from './logger';
import listJSFiles from '../helpers/file';
import path from 'path';

const assertQueue = function(ch, worker) {
  ch.assertQueue(worker.queueName, { durable: true }, function(err, _ok) {
    if (err) {
      LoggerInstance.error('[AMQP] error', err);
      assertQueue(ch, worker);
    }
    ch.consume(
      worker.queueName,
      function(msg) {
        worker.run(msg, function(ok) {
          try {
            if (ok) ch.ack(msg);
            else ch.reject(msg, true);
          } catch (e) {
            LoggerInstance.error('[AMQP] error worker', e);
            assertQueue(ch, worker);
          }
        });
      },
      { noAck: false },
    );
    LoggerInstance.info(`Worker for queue "${worker.queueName}" is started`);
  });
}

const createChannel = function(amqpConn, worker) {
  amqpConn.createChannel(function(err, ch) {
    if (err) {
      LoggerInstance.error('[AMQP] error', err);
      amqpConn.close();
    }
    ch.on('error', function(err) {
      LoggerInstance.error('[AMQP] channel error', err.message);
      createChannel(amqpConn, worker);
    });

    ch.on('close', function() {
      LoggerInstance.warn('[AMQP] channel closed');
      createChannel(amqpConn, worker);
    });

    ch.prefetch(10);
    assertQueue(ch, worker);
  });
}

export default ({ amqpConn }: { amqpConn: amqp.Connection }) => {
  return new Promise(function(resolve, reject) {
    listJSFiles(path.dirname(__dirname) + '/workers', async function(err, files) {
      if (err) {
        LoggerInstance.error('[AMQP] error', err);
        amqpConn.close();
      }
      for (var i = 0; i < files.length; i++) {
        LoggerInstance.info('running worker ' + files[i]);
        let worker = (await import(files[i])).default;
        createChannel(amqpConn, worker);
      }
      return resolve('ok');
    });
  });
};
