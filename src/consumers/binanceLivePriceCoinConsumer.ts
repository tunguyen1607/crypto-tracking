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
        let activeSymbols = [];
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
          let interval = setInterval(function() {
            console.log(activeSymbols);
          }, 5*60*1000);
          setTimeout(function() {
            console.log('wait for %s seconds', seconds);
            wss.terminate();
            clearInterval(interval);
            return resolve(true);
          }, seconds * 1000);

          // @ts-ignore
          wss.on('message', async function incoming(message) {
            let object = JSON.parse(message);
            // console.log(object);
            let symbol = object.s.replace(/USDT/g, '').toLowerCase();
            let objectPrice: any = await getAsync(symbol+'_to_usdt');
            if(objectPrice){
              objectPrice = JSON.parse(objectPrice);
            }else {
              objectPrice = {};
            }
            console.log(symbol+'_to_usdt');
            console.log(objectPrice);
            if(activeSymbols.indexOf(symbol) < 0){
              activeSymbols.push(symbol);
              activeSymbols = activeSymbols.filter(function(item, pos) {
                return activeSymbols.indexOf(item) == pos;
              })
            }
            objectPrice['price'] = object.p;
            objectPrice['timestamp'] = object.T;
            // @ts-ignore
            let btcHighPrice = objectPrice['highPrice'];
            if (!btcHighPrice || isNaN(btcHighPrice)) {
              objectPrice['highPrice'] = object.p;
              objectPrice['highPriceTimestamp'] = object.T;
            } else {
              if (parseFloat(btcHighPrice) < parseFloat(object.p)) {
                // @ts-ignore
                objectPrice['highPrice'] = object.p;
                objectPrice['highPriceTimestamp'] = object.T;
              }
            }
            // @ts-ignore
            let btcLowPrice = objectPrice['lowPrice'];
            if (!btcLowPrice || isNaN(btcLowPrice)) {
              // @ts-ignore
              objectPrice['lowPrice'] = object.p;
              objectPrice['lowPriceTimestamp'] = object.T;
            } else {
              if (parseFloat(btcLowPrice) > parseFloat(object.p)) {
                // @ts-ignore
                objectPrice['lowPrice'] = object.p;
                objectPrice['lowPriceTimestamp'] = object.T;
              }
            }
            await setAsync(symbol+'_to_usdt', JSON.stringify(objectPrice));
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
