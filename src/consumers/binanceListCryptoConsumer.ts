import { Container } from 'typedi';
import url from 'url';
import { checkDataNull } from '../helpers/object';
import WebSocket from 'ws';
import { promisify } from 'util';
import axios from "axios";
import PublishService from '../services/publish';

const blockingWait = function(seconds) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      console.log('wait for %s seconds', seconds);
      return resolve(true);
    }, seconds * 1000);
  });
};

export default {
  topic: 'BinanceListCryptoConsumer',
  status: true,
  totalConsumer: 1,
  run: async function(object) {
    return new Promise(async function(resolve, reject) {
      const Logger = Container.get('logger');
      const RedisInstance = Container.get('redisInstance');
      const cryptoModel = Container.get('cryptoModel');
      const publishServiceInstance = Container.get(PublishService);
      // @ts-ignore
      const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
      // @ts-ignore
      const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
      try {
        let linkToCall = `https://api.binance.com/api/v3/exchangeInfo`;
        console.log(linkToCall);
        const result = await axios({
          method: 'GET',
          url: linkToCall,
        });
        let listCrypto: any = result.data['symbols'];
        for (let i = 0; i < listCrypto.length; i++){
          let cryptoItem: any = listCrypto[i];
          let status = 1;
          if(cryptoItem.status == 'BREAK'){
            status = 0;
          }
          let body = {
            symbol: cryptoItem.baseAsset,
            statusMarket: cryptoItem.status,
            market: 'binance',
            status,
          }
          // @ts-ignore
          let cryptoDetail = await cryptoModel.findOne({
            where: { symbol: cryptoItem.baseAsset },
          });
          if (cryptoDetail) {
            // @ts-ignore
            await cryptoModel.update(body, {
              where: { id: cryptoDetail.id },
            });
          }else {
            console.log(body);
            console.log(cryptoItem.symbol);
            await publishServiceInstance.publish('', 'crypto_handle_detail_coinmarketcap', {
              symbol: body.symbol,
              marketData : body,
            });
          }
        }
      } catch (e) {
        // @ts-ignore
        Logger.error('🔥 Error with Email Sequence Job: %o', e);
      }
    });
  },
};
