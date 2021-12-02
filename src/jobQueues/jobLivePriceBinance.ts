import { Container } from 'typedi';
import PublishService from '../services/publish';
import { urlSlug } from '../helpers/crawler';
import axios from 'axios';
import {promisify} from "util";
import WebSocket from 'ws';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  queueName: 'jobLivePriceBinance',
  status: true,
  prefetch: 3,
  run: async function(job) {
    return new Promise(async function(resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      const publishServiceInstance = Container.get(PublishService);
      // @ts-ignore
      const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
      // @ts-ignore
      const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
      try {
        let data = job.data;
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
          let interval = setInterval(async function() {
            console.log(activeSymbols);
            activeSymbols.map(async function (symbol) {
              const result = await axios({
                method: 'GET',
                url: `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`,
              });
              await publishServiceInstance.publish('', 'crypto_handle_price_and_historical_binance', {
                symbol: symbol,
                type: '5m',
                priceObject: await getAsync(symbol + '_to_usdt'),
                ticker: result.data
              });
            })

          }, 1*60*1000);
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
            // console.log(symbol+'_to_usdt');
            // console.log(objectPrice);
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
