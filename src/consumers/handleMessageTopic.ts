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
  topic: 'jobCollectCoinPrice',
  status: true,
  totalConsumer: 1,
  run: async function(object) {
    return new Promise(async function(resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      try {
        let data = JSON.parse(object.value);
        if (data.symbol) {
          const wss = new WebSocket(`wss://stream.binance.com:9443/ws/${data.symbol.toLowerCase()}usdt@trade`);
          let seconds = 60 * 60;
          let keyCurrentPrice = data.symbol.toLowerCase() + '_current_price';
          let keyHighPrice = data.symbol.toLowerCase() + '_high_price';
          let keyHighPriceTime = data.symbol.toLowerCase() + '_high_price_time';
          let keyLowPrice = data.symbol.toLowerCase() + '_low_price';
          let keyLowPriceTime = data.symbol.toLowerCase() + '_low_price_time';
          let keyTimeStamp = data.symbol.toLowerCase() + '_current_timestamp';
          setTimeout(function() {
            console.log('wait for %s seconds', seconds);
            // wss.terminate();
            return resolve(true);
          }, seconds * 1000);
          // @ts-ignore
          wss.on('message', async function incoming(message) {
            // @ts-ignore
            const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
            // @ts-ignore
            const setAsync = promisify(RedisInstance.set).bind(RedisInstance);

            let object = JSON.parse(message);
            // @ts-ignore
            await setAsync(keyCurrentPrice, object.p);
            await setAsync(keyTimeStamp, object.T);
            // @ts-ignore
            let btcHighPrice = await getAsync(keyHighPrice);
            if (!btcHighPrice || isNaN(btcHighPrice)) {
              // @ts-ignore
              await setAsync(keyHighPrice, object.p);
              await setAsync(keyHighPrice, object.T);
            } else {
              if (parseFloat(btcHighPrice) < parseFloat(object.p)) {
                // @ts-ignore
                await setAsync(keyHighPrice, object.p);
                await setAsync(keyLowPriceTime, object.T);
              }
            }
            // @ts-ignore
            let btcLowPrice = getAsync(keyLowPrice);
            if (!btcLowPrice || isNaN(btcLowPrice)) {
              // @ts-ignore
              await setAsync(keyLowPrice, object.p);
              await setAsync(keyHighPriceTime, object.T);
            } else {
              if (parseFloat(btcLowPrice) > parseFloat(object.p)) {
                // @ts-ignore
                await setAsync(keyLowPrice, object.p);
                await setAsync(keyHighPriceTime, object.T);
              }
            }
          });

          wss.on('error', function error(error) {
            console.log(error);
            reject(error);
          });
        }
      } catch (e) {
        // @ts-ignore
        Logger.error('🔥 Error with Email Sequence Job: %o', e);
      }
    });
  },
};
