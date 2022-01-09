import {Container} from 'typedi';
import PublishService from '../services/publish';
import {urlSlug} from '../helpers/crawler';
import axios from 'axios';
import {promisify} from "util";
import WebSocket from 'ws';
import io from 'socket.io-client';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  queueName: 'jobLiveMarketPairBinance',
  status: true,
  prefetch: process.env.LIVE_PRICE_CONCURRENCY || 30,
  run: async function (job) {
    return new Promise(async function (resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      const publishServiceInstance = Container.get(PublishService);
      const cryptoModel = Container.get('CryptoPairModel');
      const producerService = Container.get('jobLiveMarketPairBinance');

      try {
        // @ts-ignore
        const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
        // @ts-ignore
        const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
        // @ts-ignore
        const sRemAsync = promisify(RedisInstance.srem).bind(RedisInstance);
        // @ts-ignore
        const sMembersAsync = promisify(RedisInstance.smembers).bind(RedisInstance);
        // @ts-ignore
        const sAddAsync = promisify(RedisInstance.sadd).bind(RedisInstance);

        let priceOpen = null;
        let priceOpenTimestamp = null;
        let priceClose = null;
        let priceCloseTimestamp = null;
        let currentPrice = null;

        let data = job.data;
        console.log(data);
        let {symbol, quoteAsset, baseAsset, exchangeId, marketPairId} = data;
        let activeSymbols = [];
        if (symbol) {
          symbol = symbol.toLowerCase().trim();
          // get access token from base account
          const accountToken = await axios({
            method: 'POST',
            url: `https://api.nynwstudio.com/api/auth/user/create`,
            data: {
              "deviceId": "system_socket_price",
              "appId": "7ea3826f5d795105",
              "bundleId": "com.nynw.crypcial.ios.test"
            }
          });
          console.log(symbol);
          let interval = setInterval(async function () {
            let priceObject = await getAsync('binance:trade:'+symbol);
            let priceTicker = await getAsync('binance:ticker:'+symbol);
            await publishServiceInstance.publish('', 'binance_market_pair_historical', {
              symbol: symbol,
              type: '3m',
              priceObject: priceObject,
              ticker: priceTicker,
              jobId: job.id,
              quoteAsset,
              baseAsset,
              exchangeId,
              marketPairId
            });
            priceObject = JSON.parse(priceObject);
            await sAddAsync('binance:24hPrice:'+symbol, JSON.stringify({
              p: priceObject.price,
              ts: priceObject.timestamp
            }));
            let price24h = await sMembersAsync('binance:24hPrice:'+symbol);
            if (price24h.length > 480) {
              price24h = price24h.map(function (history) {
                history = JSON.parse(history);
                return history;
              });
              price24h.sort(function (a, b) {
                return parseFloat(b.ts) - parseFloat(a.ts);
              });
              for (let i = 0; i < (price24h.length - 480); i++) {
                await sRemAsync('binance:24hPrice:'+symbol, JSON.stringify(price24h[price24h.length - i - 1]));
              }
            }
          }, 3 * 60 * 1000);
          let linkSuffix = `${symbol.toLowerCase()}@trade/${symbol.toLowerCase()}@ticker`;
          let linkToCall = `wss://stream.binance.com:9443/ws/${linkSuffix}`;
          console.log(linkToCall);
          const wss = new WebSocket(linkToCall);
          // or with emit() and custom event names
          let now = new Date();
          let millisTill = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 55, 59, 0).getTime() - now.getTime();
          if (millisTill < 0) {
            millisTill += 86400000; // it's after 10am, try 10am tomorrow.
          }
          setTimeout(async function () {
            if (marketPairId) {
              // @ts-ignore
              let job = await producerService.add({
                symbol, quoteAsset, baseAsset, exchangeId, marketPairId
              });
              // @ts-ignore
              await cryptoModel.update({jobId: job.id}, {where: {id: marketPairId}});
            }
            let priceSymbol = await getAsync('binance:trade:'+symbol);
            let priceTicker = await getAsync('binance:ticker:'+symbol);
            await publishServiceInstance.publish('', 'binance_market_pair_historical', {
              symbol,
              type: '1day',
              priceObject: priceSymbol,
              ticker: priceTicker,
              jobId: job.id,
              quoteAsset,
              baseAsset,
              exchangeId,
              marketPairId
            });
            priceSymbol = JSON.parse(priceSymbol);
            if (priceSymbol['closePrice'] && priceSymbol['closePriceTimestamp']) {
              let dateClose = new Date(objectPrice['closePriceTimestamp']);
              if (dateClose && dateClose.getDate() == now.getDate() && dateClose.getMonth() == now.getMonth() && dateClose.getFullYear() == now.getFullYear() && dateClose.getHours() == 23) {
                priceClose = objectPrice['openPrice'];
                priceCloseTimestamp = objectPrice['openPriceTimestamp'];
              }
            } else {
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

            let rs = await setAsync('binance:trade:'+symbol, JSON.stringify(priceSymbol));
            console.log(rs);
            wss.terminate();
            clearInterval(interval);

            return resolve(true);
          }, millisTill);
          let objectPrice: any = await getAsync('binance:trade:'+symbol);
          if (objectPrice) {
            objectPrice = JSON.parse(objectPrice);
            if (objectPrice['openPrice'] && objectPrice['openPriceTimestamp']) {
              let dateOpen = new Date(objectPrice['openPriceTimestamp']);
              if (dateOpen && dateOpen.getDate() == now.getDate() && dateOpen.getMonth() == now.getMonth() && dateOpen.getFullYear() == now.getFullYear()) {
                priceOpen = objectPrice['openPrice'];
                priceOpenTimestamp = objectPrice['openPriceTimestamp'];
              }
            }
          } else {
            objectPrice = {};
          }
          // @ts-ignore
          let socket = io('http://localhost:32857/v1/crypto/price?token=' + accountToken['data']['token']);
          socket.on("connect", async () => {
            wss.on('message', async function incoming(message) {
              let object = JSON.parse(message);
              if(object.e == 'trade'){
                if (!priceOpen) {
                  priceOpen = object.p;
                  objectPrice['openPrice'] = object.p;
                  priceOpenTimestamp = object.T;
                  objectPrice['openPriceTimestamp'] = object.T;
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
                if (parseFloat(currentPrice) != parseFloat(object.p)) {
                  socket.emit("priceLive", {method: 'system', room: symbol, data: objectPrice});
                  currentPrice = object.p;
                }
                let rs = await setAsync('binance:trade:'+symbol, JSON.stringify(objectPrice));
              }
              if(object.e == '24hrTicker'){
                await setAsync('binance:ticker:'+symbol, JSON.stringify({
                  "priceChange": object.p,
                  "priceChangePercent": object.P,
                  "weightedAvgPrice": object.w,
                  "prevClosePrice": object.x,
                  "lastPrice": object.c,
                  "lastQty": object.Q,
                  "bidPrice": object.b,
                  "bidQty": object.B,
                  "askPrice": object.a,
                  "askQty": object.A,
                  "openPrice": object.o,
                  "highPrice": object.h,
                  "lowPrice": object.l,
                  "volume": object.v,
                  "quoteVolume": object.q,
                  "openTime": object.O,
                  "closeTime": object.C,
                  "firstId": object.F,
                  "lastId": object.L,
                  "count": object.n
                }));
              }
            });
          });
          socket.on('connect_error', function (err) {
            console.log("connect failed" + err);
            reject(err);
          });
          socket.on("error", (mess) => {
            reject(mess);
          });
          wss.on('error', function error(error) {
            console.log(error);
            reject(error);
          });

        }else {
          return resolve(true)
        }

      } catch (e) {
        // @ts-ignore
        Logger.error('🔥 Error with Email Sequence Job: %o', e);
      }
    });
  },
};
