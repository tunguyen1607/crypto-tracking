import LoggerInstance from './logger';
import listJSFiles from '../helpers/file';
import path from 'path';
import kafka from 'kafka-node';
import async from 'async';
import config from '../config';
export default () => {
  return new Promise(function(resolve, reject) {
    listJSFiles(path.dirname(__dirname) + '/consumers', async function(err, files) {
      if (err) {
        LoggerInstance.error('[Kafka] error ' + err.message);
      }
      let consumerGroups = [];

      for (var i = 0; i < files.length; i++) {
        LoggerInstance.info('running consumer ' + files[i]);
        let worker = (await import(files[i])).default;
        if (worker.status) {
          let consumerOptions: kafka.ConsumerGroupOptions = {
            groupId: config.kafka.groupId,
            kafkaHost: config.kafka.host,
            sessionTimeout: 15000,
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            // The max wait time is the maximum amount of time in milliseconds to block waiting if insufficient data is available at the time the request is issued, default 100ms
            fetchMaxWaitMs: 100,
            // This is the minimum number of bytes of messages that must be available to give a response, default 1 byte
            fetchMinBytes: 1,
            // The maximum bytes to include in the message set for this partition. This helps bound the size of the response.
            fetchMaxBytes: 1024 * 100,
            // If set true, consumer will fetch message from the given offset in the payloads
            // fromOffset: false,
            // If set to 'buffer', values will be returned as raw buffer objects.
            encoding: 'utf8',
            keyEncoding: 'utf8',
            protocol: ['roundrobin'],
            fromOffset: 'earliest', // equivalent of auto.offset.reset valid values are 'none', 'latest', 'earliest',
          };
          let topic = worker.topic;
          let totalConsumer = worker.totalConsumer || 20;
          for (var i = 0; i < totalConsumer; i++) {
            consumerOptions['id'] = 'consumer' + i;
            var consumerGroup = new kafka.ConsumerGroup(consumerOptions, topic);
            consumerGroups.push(consumerGroup);
            consumerGroup.on('error', function(error) {
              LoggerInstance.error(error.stack);
              console.error(error);
            });
            consumerGroup.on('message', async function(message) {
              try {
                this.pause();
                console.log(
                  '%s read msg Topic="%s" Partition=%s Offset=%d',
                  this.client.clientId,
                  message.topic,
                  message.partition,
                  message.offset,
                  message.value,
                );
                await worker.run(message);
              } catch (e) {
                LoggerInstance.error('[kafka] error worker ' + JSON.stringify(worker.topic) + ':' + e.message);
                console.error(e);
              } finally {
                this.resume();
              }
            });
          }
        }
      }
      process.once('SIGINT', () => {
        console.log('SIGINT');
        async.each(consumerGroups, (consumer, callback) => {
          consumer.close(true, callback);
        });
        // process.exit(0);
      });
      return resolve('ok');
    });
  });
};
