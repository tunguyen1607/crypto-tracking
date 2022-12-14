import kafka from 'kafka-node';
import LoggerInstance from './logger';
import config from '../config';

export default (): Promise<kafka.Producer> => {
  return new Promise(function(resolve, reject) {
    try {
      let kafkaConfig = {
        kafkaBrokers: config.kafka.host,
      };
      let HighLevelProducer = kafka.HighLevelProducer;

      let client = new kafka.KafkaClient({
        kafkaHost: kafkaConfig.kafkaBrokers,
      });

      if (client) {
        let producer = new HighLevelProducer(client);
        LoggerInstance.info('KafkaService =======> connect success');
        producer.on('ready', () => {
          LoggerInstance.info('KafkaService =======> produce ready');

          resolve(producer);
        });
      } else {
        reject(new Error('not found client producer'));
      }
    } catch (error) {
      LoggerInstance.error('KafkaService =======> connect error', error);
      reject(error);
    }
  });
};
