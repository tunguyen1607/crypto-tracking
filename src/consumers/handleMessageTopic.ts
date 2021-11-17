import { Container } from 'typedi';
import url from 'url';
import { checkDataNull } from '../helpers/object';
import WebSocket from 'ws';
import { promisify } from 'util';

const blockingWait = function(seconds) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      console.log('wait for %s seconds', seconds);
      return resolve(true);
    }, seconds * 1000);
  });
};

export default {
  topic: 'kafkaTest1',
  status: true,
  totalConsumer: 1,
  run: async function(object) {
    console.log('receive ', object);
    return new Promise(async function(resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      const wss = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      try {
        let seconds = 5;
        setTimeout(function() {
          console.log('wait for %s seconds', seconds);
          wss.terminate();
          return resolve(true);
        }, seconds * 1000);
        // @ts-ignore
        wss.on('message', async function incoming(message) {
          console.log(message);
          // @ts-ignore
          const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
          // @ts-ignore
          const setAsync = promisify(RedisInstance.set).bind(RedisInstance);

          let object = JSON.parse(message);
          // @ts-ignore
          await setAsync('btc_current_price', object.p);
          await setAsync('btc_timestamp', object.T);
          // @ts-ignore
          let btcHighPrice = await getAsync('btc_high_price');
          if (!btcHighPrice || isNaN(btcHighPrice)) {
            // @ts-ignore
            await setAsync('btc_high_price', object.p);
            await setAsync('btc_high_price', object.T);
          } else {
            if (parseFloat(btcHighPrice) < parseFloat(object.p)) {
              // @ts-ignore
              await setAsync('btc_high_price', object.p);
              await setAsync('btc_high_price_time', object.T);
            }
          }
          // @ts-ignore
          let btcLowPrice = getAsync('btc_low_price');
          if (!btcLowPrice || isNaN(btcLowPrice)) {
            // @ts-ignore
            await setAsync('btc_low_price', object.p);
            await setAsync('btc_low_price_time', object.T);
          } else {
            if (parseFloat(btcLowPrice) > parseFloat(object.p)) {
              // @ts-ignore
              await setAsync('btc_low_price', object.p);
              await setAsync('btc_low_price_time', object.T);
            }
          }
        });

        wss.on('error', function error(error) {
          console.log(error);
          reject(error);
        });
      } catch (e) {
        // @ts-ignore
        Logger.error('🔥 Error with Email Sequence Job: %o', e);
      }
    });
  },
};
