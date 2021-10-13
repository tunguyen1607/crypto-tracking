import { Service, Inject } from 'typedi';

@Service()
export default class PublishService {
  constructor(@Inject('publisherInstance') private pubChannel, @Inject('logger') private logger) {}

  public async publish(exchange, routingKey, content: any) {
    try {
      let that = this;
      this.logger.silly('Sending message to queue ' + routingKey + ': ' + JSON.stringify(content));
      this.pubChannel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(content)),
        { persistent: true },
        function(err, ok) {
          if (err) {
            that.logger.error('[AMQP] publish' + err.message);
            that.pubChannel.connection.close();
          }
          return Promise.resolve(ok);
        },
      );
    } catch (e) {
      this.logger.error('[AMQP] publish ' + e.message);
      return Promise.reject(e);
    }
  }
}
