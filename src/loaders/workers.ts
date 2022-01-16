import amqp from 'amqplib/callback_api';
import LoggerInstance from './logger';
import listJSFiles from '../helpers/file';
import path from 'path';

export default ({ amqpConn }: { amqpConn: amqp.Connection }) => {
  return new Promise(function(resolve, reject) {
    if (!amqpConn) {
      return resolve(false);
    }
    listJSFiles(path.dirname(__dirname) + '/workers', async function(err, files) {
      if (err) {
        LoggerInstance.error('[AMQP] error ' + err.message);
        amqpConn.close();
      }
      let promiseArr = [];
      for (var i = 0; i < files.length; i++) {
        let worker: any = await import(files[i]);
        worker = worker.default;
        if (worker && worker.status) {
          amqpConn.createChannel(function(err, ch) {
            if (err) {
              LoggerInstance.error('[AMQP] error ' + err.message);
              amqpConn.close();
            }

            ch.on('close', function() {
              LoggerInstance.warn('[AMQP] channel closed');
              // await createChannel(amqpConn, worker);
            });
            ch.assertQueue(worker.queueName, { durable: true });
            ch.prefetch(worker.prefetch ? worker.prefetch : 1);
            LoggerInstance.info('[AMQP] channel connected');
            LoggerInstance.info(`Worker for queue "${worker.queueName}" is started`);
            ch.consume(
              worker.queueName,
              function(msg) {
                try {
                  worker.run(msg, function(ok) {
                    try {
                      if (ok) ch.ack(msg);
                      else ch.reject(msg, true);
                    } catch (e) {
                      LoggerInstance.error('[AMQP] error worker ' + e.message);
                      // await assertQueue(ch, worker);
                    }
                  });
                } catch (e) {
                  LoggerInstance.error('[AMQP] error worker ' + worker.queueName + ':' + e.message);
                  console.error(e);
                  // await assertQueue(ch, worker);
                }
              },
              { noAck: false },
            );
          });
        }
      }
      resolve('ok');
    });
  });
};
