import { Container } from 'typedi';
import url from 'url';

export default {
  topic: 'testProducer',
  status: true,
  totalConsumer: 10,
  run: async function(msg) {
    return new Promise(function(resolve, reject) {
      console.log(JSON.parse(msg.value));
      resolve(msg);
    });
  },
};
