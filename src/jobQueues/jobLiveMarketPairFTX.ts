import {Container} from 'typedi';
import PublishService from '../services/publish';
import {urlSlug} from '../helpers/crawler';
import axios from 'axios';
import {promisify} from "util";
import WebSocket from 'ws';
import io from 'socket.io-client';
import jobLiveMarketPairBinance from "./jobLiveMarketPairBinance";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  queueName: 'jobLiveMarketPairFTX',
  status: true,
  prefetch: process.env.LIVE_PRICE_CONCURRENCY || 30,
  run: function (job) {
    return new Promise(async function (resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      const publishServiceInstance = Container.get(PublishService);
      const CryptoPairModel = Container.get('CryptoPairModel');
      const producerService = Container.get('jobLiveMarketPairFTX');
      let data = job.data;
      try {
        let countMinutes = 0;
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

        let {symbol, quoteAsset, baseAsset, exchangeId, marketPairId} = data;
        console.log(data);
        if (symbol) {
          let priceOpen = null;
          let priceOpenTimestamp = null;
          let priceClose = null;
          let priceCloseTimestamp = null;
          let currentPrice = null;
          let now = new Date();
          let millisTill = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 55, 59, 0).getTime() - now.getTime();
          if (millisTill < 0) {
            millisTill += 86400000; // it's after 10am, try 10am tomorrow.
          }
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
          let linkToCall = `wss://ftx.com/ws/`;
          console.log(linkToCall);
          const wss = new WebSocket(linkToCall);
          let objectPrice: any = await getAsync('ftx:trade:'+symbol);
          if(objectPrice) {
            objectPrice = JSON.parse(objectPrice);
            if (objectPrice['openPrice'] && objectPrice['openPriceTimestamp']) {
              let dateOpen = new Date(objectPrice['openPriceTimestamp']);
              if (dateOpen && dateOpen.getDate() == now.getDate() && dateOpen.getMonth() == now.getMonth() && dateOpen.getFullYear() == now.getFullYear()) {
                priceOpen = objectPrice['openPrice'];
                priceOpenTimestamp = objectPrice['openPriceTimestamp'];
              }
            }
          }else {
            const result = await axios({
              method: 'GET',
              url: `https://ftx.com/api/markets/${symbol.toUpperCase()}/candles?resolution=15`,
            });
            const resultTicker = await axios({
              method: 'GET',
              url: `https://ftx.com/api/markets/${symbol.toUpperCase()}`,
            });
            let candles: any = result.data['result'][result.data['result'].length - 1];
            let ticker: any = resultTicker.data['result'];
            objectPrice = {
              symbol,
              price: candles.close,
              timestamp: new Date(candles.startTime).getMilliseconds(),
              openPrice: candles.open,
              openPriceTimestamp: new Date(candles.startTime).getMilliseconds(),
              highPrice: candles.high,
              lowPrice: candles.low,
            };
            let objectTicker = {
              "symbol": symbol,
              "priceChange": ticker.change24h,
              "priceChangePercent": (ticker.change24h/ticker.price)*100,
              "lastPrice": ticker.last,
              "bidPrice": ticker.bid,
              "askPrice": ticker.ask,
              "openPrice": candles.open,
              "highPrice": candles.high,
              "lowPrice": candles.low,
              "volume": candles.volume,
              "quoteVolume": ticker.quoteVolume24h,
              "openTime": new Date(candles.startTime).getMilliseconds(),
              "closeTime": new Date(candles.startTime).getMilliseconds()
            };
            await setAsync('ftx:trade:'+symbol, JSON.stringify(objectPrice));
            await setAsync('ftx:ticker:'+symbol, JSON.stringify(objectTicker));
          }
          // @ts-ignore
          let socket = io('http://localhost:32857/v1/crypto/price?token=' + accountToken['data']['token']);
          socket.on("connect", async () => {
            wss.on('open', function open() {
              console.log('connected');
              wss.send(JSON.stringify({'op': 'subscribe', 'channel': 'trades', 'market': symbol}));
              wss.send(JSON.stringify({'op': 'subscribe', 'channel': 'ticker', 'market': symbol}));
            });
            wss.on('message', async function incoming(message) {
              let object = JSON.parse(message);
              console.log(object);
              let lastTrade = object.data[0];
              if(object.channel == 'trades'){
                if (!priceOpen) {
                  priceOpen = lastTrade.price;
                  priceOpenTimestamp = new Date(lastTrade.time).getMilliseconds();
                  objectPrice['openPrice'] = lastTrade.price;
                  objectPrice['openPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                }
                objectPrice['price'] = lastTrade.price;
                objectPrice['timestamp'] = new Date(lastTrade.time).getMilliseconds();

                let btcHighPrice = objectPrice['highPrice'];
                if (!btcHighPrice || isNaN(btcHighPrice)) {
                  objectPrice['highPrice'] = lastTrade.price;
                  objectPrice['highPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                } else {
                  if (parseFloat(btcHighPrice) < parseFloat(object.p)) {
                    objectPrice['highPrice'] = lastTrade.price;
                    objectPrice['highPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                  }
                }
                let btcLowPrice = objectPrice['lowPrice'];
                if (!btcLowPrice || isNaN(btcLowPrice)) {
                  objectPrice['lowPrice'] = lastTrade.price;
                  objectPrice['lowPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                } else {
                  if (parseFloat(btcLowPrice) > parseFloat(object.p)) {
                    objectPrice['lowPrice'] = lastTrade.price;
                    objectPrice['lowPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                  }
                }
                objectPrice['symbol'] = symbol;
                if (parseFloat(currentPrice) != parseFloat(object.p)) {
                  socket.emit("priceLive", {method: 'system', room: 'ftx:'+symbol, data: objectPrice});
                  currentPrice = object.p;
                }
                await setAsync('ftx:trade:'+symbol, JSON.stringify(objectPrice));
              }

              if(object.channel == 'ticker' && now.getMinutes() == 0){
                let ticker = object.data;
                if(!objectPrice){
                  objectPrice = {
                    symbol,
                    price: ticker.last,
                    timestamp: new Date(ticker.time).getMilliseconds(),
                  }
                  await setAsync('binance:trade:'+symbol, JSON.stringify(objectPrice));
                }
                await setAsync('binance:ticker:'+symbol, JSON.stringify({
                  "priceChange": object.p,
                  "priceChangePercent": object.P,
                  "lastPrice": ticker.last,
                  "bidPrice": ticker.bid,
                  "bidQty": ticker.bidSize,
                  "askPrice": ticker.ask,
                  "askQty": ticker.askSize,
                  "openPrice": object.o,
                  "highPrice": object.h,
                  "lowPrice": object.l,
                  "volume": object.v,
                  "quoteVolume": object.q,
                  "openTime": new Date(Math.ceil(ticker.time)).getMilliseconds(),
                  "closeTime": new Date(Math.ceil(ticker.time)).getMilliseconds(),
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
        let {symbol, quoteAsset, baseAsset, exchangeId, marketPairId} = data;
        // @ts-ignore
        await producerService.add({
          symbol, quoteAsset, baseAsset, exchangeId, marketPairId
        });
        // @ts-ignore
        Logger.error('🔥 Error jobLiveMarketPairFTX: %o', e);
      }
    });
  },
};
