import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: '<key>',
  APISECRET: '<secret>'
});

export default {
  queueName: 'crypto_handle_list_binance',
  status: true,
  run: async function(message, cb) {
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
    }finally {
      cb(true);
    }
  },
};
