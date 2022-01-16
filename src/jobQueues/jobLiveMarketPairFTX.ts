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
          // @ts-ignore
          let socket = io('http://localhost:32857/v1/crypto/price?token=' + accountToken['data']['token']);
          socket.on("connect", async () => {
            wss.on('open', function open() {
              console.log('connected');
              wss.send(JSON.stringify({'op': 'subscribe', 'channel': 'trades', 'market': 'BTC/USD'}));
              // wss.send(JSON.stringify({'op': 'subscribe', 'channel': 'ticker', 'market': 'BTC/USD'}));
            });
            wss.on('message', async function incoming(message) {
              let object = JSON.parse(message);
              console.log(object);
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
