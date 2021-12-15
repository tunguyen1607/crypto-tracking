import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import BinanceService from '../services/binance';

export default {
  queueName: 'crypto_handle_list_binance',
  status: true,
  run: async function(message, cb) {
    const Logger = Container.get('logger');
    const RedisInstance = Container.get('redisInstance');
    const cryptoModel = Container.get('cryptoModel');
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    const publishServiceInstance = Container.get(PublishService);
    const binanceServiceInstance = Container.get(BinanceService);
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
    try {
      const result:any = binanceServiceInstance.exchangeInfo();
      let listCrypto: any = result.data['symbols'];
      for (let i = 0; i < listCrypto.length; i++){
        let cryptoItem: any = listCrypto[i];
        let status = 1;
        if(cryptoItem.status == 'BREAK'){
          status = 0;
        }
        // @ts-ignore
        let cryptoMarketItem = await cryptoExchangeModel.findOne({
          where: {
            symbol: cryptoItem.symbol,
            market: 'binance'
          }
        });

        if(!cryptoMarketItem){
          // @ts-ignore
          await cryptoExchangeModel.create({
            symbol: cryptoItem.symbol,
            baseAsset: cryptoItem.baseAsset,
            quoteAsset: cryptoItem.quoteAsset,
            config: cryptoItem,
            status,
            market: 'binance',
            statusMarket: cryptoItem.status
          });
        }

        let body = {
          symbol: cryptoItem.baseAsset,
          statusMarket: cryptoItem.status,
          market: 'binance',
          status,
        };
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
