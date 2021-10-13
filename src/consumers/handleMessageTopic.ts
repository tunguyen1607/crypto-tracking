import { Container } from 'typedi';
import url from 'url';
import { checkDataNull } from '../helpers/object';

export default {
  topic: 'prepareDataToNotify',
  status: true,
  totalConsumer: 10,
  run: async function(message) {
    const Channel = Container.get('ChannelModel');
    return new Promise(async function(resolve, reject) {
      try {

      } catch (error) {
        reject(error);
      }
    });
  },
};
