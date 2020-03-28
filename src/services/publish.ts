import {Service, Inject} from 'typedi';

@Service()
export default class PublishService {
  constructor(
    @Inject('publisherInstance') private pubChannel,
    @Inject('logger') private logger
  ) {
  }

  public async publish(exchange, routingKey, content) {
    return new Promise(function(resolve, reject) {
      try {
        let that = this;
        this.pubChannel.publish(exchange, routingKey, content, { persistent: true }, function(err, ok) {
            if (err) {
              that.logger.error('[AMQP] publish', err);
              that.pubChannel.connection.close();
            }
            resolve(ok);
          });
      } catch (e) {
        this.logger.error('[AMQP] publish', e.message);
        reject(e);
      }
    });
  }
}
