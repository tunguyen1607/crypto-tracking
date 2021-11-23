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
  topic: 'BinanceLivePriceCoinConsumer',
  status: true,
  totalConsumer: 1,
  run: async function(object) {
    return new Promise(async function(resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      // @ts-ignore
      const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
      // @ts-ignore
      const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
      try {
        let data = JSON.parse(object.value);
        if (data.symbols) {
          let symbols = data.symbols;
          if (!Array.isArray(symbols)) {
            symbols = symbols.split(',');
          }
          let linkSuffix = '';
          for (let s = 0; s < symbols.length; s++) {
            linkSuffix += `${symbols[s].toLowerCase()}usdt@trade`;
            if (s < symbols.length - 1) {
              linkSuffix += '/';
            }
          }
          let linkToCall = `wss://stream.binance.com:9443/ws/${linkSuffix}`;
          console.log(linkToCall);
          const wss = new WebSocket(linkToCall);
          let seconds = 60 * 60;

          setTimeout(function() {
            console.log('wait for %s seconds', seconds);
            wss.terminate();
            return resolve(true);
          }, seconds * 1000);
          // @ts-ignore
          wss.on('message', async function incoming(message) {


            let object = JSON.parse(message);
            console.log(object);
            let symbol = object.s.replace(/USDT/g, '').toLowerCase();
            let keyCurrentPrice = symbol + '_current_price';
            let keyTimeStamp = symbol + '_current_timestamp';
            let keyHighPrice = symbol + '_high_price';
            let keyHighPriceTime = symbol + '_high_price_time';
            let keyLowPrice = symbol + '_low_price';
            let keyLowPriceTime = symbol + '_low_price_time';
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
