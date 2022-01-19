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
      const cryptoMarketModel = Container.get('CryptoPairModel');
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
          let linkToCall = `wss://ftx.com/ws/`;
          console.log(linkToCall);
          const wss = new WebSocket(linkToCall);
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
          // @ts-ignore
          let socket = io('http://localhost:32857/v1/crypto/price?token=' + accountToken['data']['token']);
          let interval = setInterval(async function () {
            let priceObject = await getAsync('ftx:trade:'+symbol);
            let priceTicker = await getAsync('ftx:ticker:'+symbol);
            countMinutes++;
            await publishServiceInstance.publish('', 'crypto_save_market_pair_historical', {
              symbol: symbol,
              type: '1m',
              priceObject: priceObject,
              ticker: priceTicker,
              jobId: job.id,
              quoteAsset,
              baseAsset,
              exchangeId,
              marketPairId,
              timestamp: Date.now(),
              market: 'ftx'
            });
            if(countMinutes % 400 == 0){
              await publishServiceInstance.publish('', 'crypto_clean_up_market_pair_historical', {
                exchangeId,
                marketPairId,
              });
              countMinutes = 0;
            }
            priceObject = JSON.parse(priceObject);
            if(priceObject && new Date().getMinutes() % 3 == 0){
              await sAddAsync('ftx:24hPrice:'+symbol, JSON.stringify({
                p: priceObject.price,
                ts: priceObject.timestamp
              }));
              let price24h = await sMembersAsync('ftx:24hPrice:'+symbol);
              if (price24h.length > 480) {
                price24h = price24h.map(function (history) {
                  history = JSON.parse(history);
                  return history;
                });
                price24h.sort(function (a, b) {
                  return parseFloat(b.ts) - parseFloat(a.ts);
                });
                for (let i = 0; i < (price24h.length - 480); i++) {
                  await sRemAsync('ftx:24hPrice:'+symbol, JSON.stringify(price24h[price24h.length - i - 1]));
                }
              }
            }
          }, 60 * 1000);
          setTimeout(async function () {
            if (marketPairId) {
              // @ts-ignore
              let job = await producerService.add({
                symbol, quoteAsset, baseAsset, exchangeId, marketPairId
              });
              // @ts-ignore
              await cryptoMarketModel.update({jobId: job.id}, {where: {id: marketPairId}});
            }
            let priceSymbol = await getAsync('ftx:trade:'+symbol);
            let priceTicker = await getAsync('ftx:ticker:'+symbol);
            await publishServiceInstance.publish('', 'crypto_save_market_pair_historical', {
              symbol,
              type: '1day',
              priceObject: priceSymbol,
              ticker: priceTicker,
              jobId: job.id,
              quoteAsset,
              baseAsset,
              exchangeId,
              marketPairId,
              market: 'ftx'
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

            let rs = await setAsync('ftx:trade:'+symbol, JSON.stringify(priceSymbol));
            wss.terminate();
            socket.close();
            clearInterval(interval);
            return resolve(true);
          }, millisTill);

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
              "volume": ticker.quoteVolume24h / ticker.last,
              "quoteVolume": ticker.quoteVolume24h,
              "openTime": new Date(candles.startTime).getMilliseconds(),
              "closeTime": new Date().getMilliseconds()
            };
            await setAsync('ftx:trade:'+symbol, JSON.stringify(objectPrice));
            await setAsync('ftx:ticker:'+symbol, JSON.stringify(objectTicker));
          }

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
                  if (parseFloat(btcHighPrice) < parseFloat(lastTrade.price)) {
                    objectPrice['highPrice'] = lastTrade.price;
                    objectPrice['highPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                  }
                }
                let btcLowPrice = objectPrice['lowPrice'];
                if (!btcLowPrice || isNaN(btcLowPrice)) {
                  objectPrice['lowPrice'] = lastTrade.price;
                  objectPrice['lowPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                } else {
                  if (parseFloat(btcLowPrice) > parseFloat(lastTrade.price)) {
                    objectPrice['lowPrice'] = lastTrade.price;
                    objectPrice['lowPriceTimestamp'] = new Date(lastTrade.time).getMilliseconds();
                  }
                }
                objectPrice['symbol'] = symbol;
                if (parseFloat(currentPrice) != parseFloat(lastTrade.price)) {
                  socket.emit("priceLive", {method: 'system', room: 'ftx:'+symbol, data: objectPrice});
                  currentPrice = lastTrade.price;
                }
                await setAsync('ftx:trade:'+symbol, JSON.stringify(objectPrice));
              }

              if(object.channel == 'ticker' && new Date().getMinutes() == 0){
                let ticker = object.data;
                if(!objectPrice){
                  objectPrice = {
                    symbol,
                    price: ticker.last,
                    timestamp: new Date(ticker.time).getMilliseconds(),
                  };
                  await setAsync('ftx:trade:'+symbol, JSON.stringify(objectPrice));
                }
                await setAsync('ftx:ticker:'+symbol, JSON.stringify({
                  "priceChange": ticker.last - objectPrice.openPrice,
                  "priceChangePercent": ((ticker.last - objectPrice.openPrice)/ticker.last)*100,
                  "lastPrice": ticker.last,
                  "bidPrice": ticker.bid,
                  "bidQty": ticker.bidSize,
                  "askPrice": ticker.ask,
                  "askQty": ticker.askSize,
                  "openPrice": objectPrice.openPrice,
                  "highPrice": objectPrice.highPrice,
                  "lowPrice": objectPrice.lowPrice,
                  "volume": object.v,
                  "quoteVolume": object.q,
                  "openTime": objectPrice.openPriceTimestamp,
                  "closeTime": new Date(Math.ceil(ticker.time)*1000).getMilliseconds(),
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
