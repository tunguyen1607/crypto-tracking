import amqp from 'amqplib/callback_api';
import LoggerInstance from './logger';
import listJSFiles from '../helpers/file';
import path from 'path';

const assertQueue = function(ch, worker) {
  return new Promise(function(resolve, reject) {
    ch.assertQueue(worker.queueName, { durable: true }, async function(err, _ok) {
      if (err) {
        LoggerInstance.error('[AMQP] error ' + err.message);
        await assertQueue(ch, worker);
      }
      ch.consume(
        worker.queueName,
        async function(msg) {
          try {
            worker.run(msg, async function(ok) {
              try {
                if (ok) ch.ack(msg);
                else ch.reject(msg, true);
              } catch (e) {
                LoggerInstance.error('[AMQP] error worker ' + e.message);
                await assertQueue(ch, worker);
              }
            });
            resolve('assert queue success');
          } catch (e) {
            LoggerInstance.error('[AMQP] error worker ' + worker.queueName + ':' + e.message);
            console.error(e);
            await assertQueue(ch, worker);
          }
        },
        { noAck: false },
      );
      LoggerInstance.info(`Worker for queue "${worker.queueName}" is started`);
    });
  });
}

const createChannel = function(amqpConn, worker) {
  return new Promise(function(resolve, reject) {
    amqpConn.createChannel(async function(err, ch) {
      LoggerInstance.info('[AMQP] channel connected')
      if (err) {
        LoggerInstance.error('[AMQP] error ' + err.message);
        amqpConn.close();
      }

      ch.on('close', async function() {
        LoggerInstance.warn('[AMQP] channel closed');
        await createChannel(amqpConn, worker);
      });

      ch.prefetch(worker.prefetch ? worker.prefetch : 1);
      resolve(await assertQueue(ch, worker));
    });
  });
}

export default ({ amqpConn }: { amqpConn: amqp.Connection }) => {
  return new Promise(function(resolve, reject) {
    listJSFiles(path.dirname(__dirname) + '/workers', async function(err, files) {
      if (err) {
        LoggerInstance.error('[AMQP] error ' + err.message);
        amqpConn.close();
      }
      for (var i = 0; i < files.length; i++) {
        LoggerInstance.info('running worker ' + files[i]);
        let worker = (await import(files[i])).default;
        if (worker.status)
          createChannel(amqpConn, worker)
            .then(function(ok) {
              LoggerInstance.info(ok);
            })
            .catch(function(err) {
              LoggerInstance.error(err);
            });
      }
      return resolve('ok');
    });
  });
};
