import { Container } from 'typedi';
import url from 'url';
import { checkDataNull } from '../helpers/object';

const blockingWait = function(seconds) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      console.log('wait for %s seconds', seconds);
      return resolve(true);
    }, seconds * 1000);
  });
};

export default {
  topic: 'prepareDataToNotify',
  status: true,
  totalConsumer: 1,
  run: async function(message) {
    return new Promise(async function(resolve, reject) {
      try {
        console.log('vao', message);
        await blockingWait(60 * 60 * 2);
        console.log('end');
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  },
};
