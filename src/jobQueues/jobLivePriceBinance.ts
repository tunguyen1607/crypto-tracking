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
      let priceOpen = null;
      let priceOpenTimestamp = null;
      let priceClose = null;
      let priceCloseTimestamp = null;
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

          const accountToken = await axios({
            method: 'POST',
            url: `https://api.nynwstudio.com/api/auth/user/create`,
            data: {
              "deviceId": "system_socket_price",
              "appId": "7ea3826f5d795105",
              "bundleId": "com.nynw.crypcial.ios.test"
            }
          });

          console.log(accountToken);

          let socket = io('http://localhost:32857/v1/crypto/price?token='+accountToken['data']['token']);
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
                if(priceSymbol['closePrice'] && priceSymbol['closePriceTimestamp']){
                  let dateClose = new Date(objectPrice['closePriceTimestamp']);
                  if(dateClose && dateClose.getDate() == now.getDate() && dateClose.getMonth() == now.getMonth() && dateClose.getFullYear() == now.getFullYear() && dateClose.getHours() == 23){
                    priceClose = objectPrice['openPrice'];
                    priceCloseTimestamp = objectPrice['openPriceTimestamp'];
                  }
                }else {
                  priceClose = objectPrice['price'];
                  priceCloseTimestamp = objectPrice['timestamp'];
                }
                delete priceSymbol['highPrice'];
                delete priceSymbol['highPriceTimestamp'];
                delete priceSymbol['lowPrice'];
                delete priceSymbol['lowPriceTimestamp'];
                delete priceSymbol['openPrice'];
                delete priceSymbol['openPriceTimestamp'];
                delete priceSymbol['closePrice'];
                delete priceSymbol['closePriceTimestamp'];

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
              if(objectPrice['openPrice'] && objectPrice['openPriceTimestamp']){
                let dateOpen = new Date(objectPrice['openPriceTimestamp']);
                if(dateOpen && dateOpen.getDate() == now.getDate() && dateOpen.getMonth() == now.getMonth() && dateOpen.getFullYear() == now.getFullYear()){
                  priceOpen = objectPrice['openPrice'];
                  priceOpenTimestamp = objectPrice['openPriceTimestamp'];
                }
              }
            }else {
              objectPrice = {};
            }
            // @ts-ignore
            wss.on('message', async function incoming(message) {
              let object = JSON.parse(message);
              if(!priceOpen){
                priceOpen = object.p;
                objectPrice['openPrice'] = object.p;
                priceOpenTimestamp = object.T;
                objectPrice['openPriceTimestamp'] = object.T;
              }
              // console.log(object);
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
              objectPrice['symbol'] = symbol;
              if(parseFloat(objectPrice['price']) != parseFloat(object.p)){
                socket.emit("priceLive", {method: 'system', room: symbol, data: objectPrice});
              }
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
