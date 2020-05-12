import { Service, Inject } from 'typedi';

@Service()
export default class PublishService {
  constructor(@Inject('producerInstance') private producer, @Inject('logger') private logger) {}

  public async send(topic, message: any) {
    let that = this;
    return new Promise(function(resolve, reject) {
      try {
        that.logger.silly('Sending message to queue ' + topic + ': ' + JSON.stringify(message));
        let payloads = [
          {
            topic: topic,
            messages: JSON.stringify(message),
          },
        ];
        that.producer.send(payloads, (err, result) => {
          ///   sails.log.info(LogHelper.Add("KafkaService =======>send success "), result);

          if (err) {
            that.logger.error('KafkaService =======> send error', err);
            reject(err);
          }

          resolve(result);
        });

        that.producer.on('error', err => {
          that.logger.error('KafkaService =======> producer error', err);
          reject(err);
        });
      } catch (e) {
        that.logger.error('[kafka] producer ' + e.message);
        return reject(e);
      }
    });
  }
}
