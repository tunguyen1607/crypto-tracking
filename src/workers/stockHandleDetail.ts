import { Container } from 'typedi';
import PublishService from '../services/publish';

export default {
  queueName: 'stock_handle_detail_cafef',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    try {
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
