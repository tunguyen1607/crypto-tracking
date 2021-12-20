import { Container } from 'typedi';
import PublishService from '../services/publish';
import { urlSlug } from '../helpers/crawler';
import axios from 'axios';
import {promisify} from "util";
import WebSocket from 'ws';
import io from 'socket.io-client';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  queueName: 'jobLivePriceBinance',
  status: true,
  prefetch: process.env.LIVE_PRICE_CONCURRENCY || 30,
  run: async function(job) {
    return new Promise(async function(resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      const publishServiceInstance = Container.get(PublishService);
      const cryptoModel = Container.get('cryptoModel');
      const producerService = Container.get('jobLivePriceBinance');
      try {
        // @ts-ignore
        const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
        // @ts-ignore
        const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
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

          let socket = io('http://localhost:32857/v1/crypto/price?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYjNkNTQ1ZDI4ZTU1MTY5MjI2YzI1NjNhNTVmMWFlZDcyZGVmZDI5OTM2YSIsImFwcElkIjoiMDQxYTFhNWIxYjEwY2M4NDkzZGYiLCJidW5kbGVJZCI6ImNvbS5ueW53LnNjb3JlIiwiZXhwIjoxNjM5OTIxNjA3LjQ4NCwiaWF0IjoxNjM5NjYyNDA3fQ.SHvJ1aYHf7SFwD17X7C4ORXzufjhJwyuAmfSovIlsV8');
          socket.on("connect", async () => {
            let linkToCall = `wss://stream.binance.com:9443/ws/${linkSuffix}`;
            console.log(linkToCall);
            const wss = new WebSocket(linkToCall);
            let interval = setInterval(async function() {
              activeSymbols.map(async function (symbol) {
                await publishServiceInstance.publish('', 'crypto_handle_price_and_historical_binance', {
                  symbol: symbol,
                  type: '5m',
                  priceObject: await getAsync(symbol + '_to_usdt'),
                  jobId: job.id,
                });
              })
            }, 5*60*1000);
            // or with emit() and custom event names
            let now = new Date();
            let millisTill = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 55, 59, 0).getTime() - now.getTime();
            if (millisTill < 0) {
              millisTill += 86400000; // it's after 10am, try 10am tomorrow.
            }
            setTimeout( function(){
              activeSymbols.map(async function (symbol) {
                if(data.cryptoId){
                  // @ts-ignore
                  let job = await producerService.add({
                    symbols: symbol.toLowerCase(),
                  });
                  // @ts-ignore
                  await cryptoModel.update({jobId: job.id}, {where: {id: data.cryptoId}});
                }
                let priceSymbol = await getAsync(symbol + '_to_usdt');
                const result = await axios({
                  method: 'GET',
                  url: `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`,
                });
                await publishServiceInstance.publish('', 'crypto_handle_price_and_historical_binance', {
                  symbol: symbol,
                  type: '1day',
                  priceObject: priceSymbol,
                  ticker: result.data,
                  jobId: job.id,
                });
                priceSymbol = JSON.parse(priceSymbol);
                delete priceSymbol['highPrice'];
                delete priceSymbol['highPriceTimestamp'];
                delete priceSymbol['lowPrice'];
                delete priceSymbol['lowPriceTimestamp'];
                let rs = await setAsync(symbol + '_to_usdt', JSON.stringify(priceSymbol));
                console.log(rs);
              });
              wss.terminate();
              clearInterval(interval);

              return resolve(true);
            }, millisTill);
            let symbol = symbols[0].toLowerCase();
            let objectPrice: any = await getAsync(symbol+'_to_usdt');
            if(objectPrice){
              objectPrice = JSON.parse(objectPrice);
            }else {
              objectPrice = {};
            }
            // @ts-ignore
            wss.on('message', async function incoming(message) {
              let object = JSON.parse(message);
              // console.log(object);
              if(activeSymbols.indexOf(symbol) < 0){
                activeSymbols.push(symbol);
                activeSymbols = activeSymbols.filter(function(item, pos) {
                  return activeSymbols.indexOf(item) == pos;
                })
              }
              if(parseFloat(objectPrice['price']) != parseFloat(object.p)){
                socket.emit("priceLive", {method: 'system', room: symbol, data: JSON.parse(await getAsync(symbol+'_to_usdt'))});
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
              objectPrice['symbol'] = symbol;
              let rs = await setAsync(symbol+'_to_usdt', JSON.stringify(objectPrice));
            });

            wss.on('error', function error(error) {
              console.log(error);
              reject(error);
            });
          });
          socket.on('connect_error', function(err)
          {
            console.log("connect failed"+err);
          });
          socket.on("error", (mess)=>{
            console.log(mess)
          })
        }
      } catch (e) {
        // @ts-ignore
        Logger.error('🔥 Error with Email Sequence Job: %o', e);
      }
    });
  },
};
