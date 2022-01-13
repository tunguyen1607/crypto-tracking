import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import BinanceService from '../services/binance';

export default {
  queueName: 'binance_handle_list_pair',
  status: true,
  run: async function(message, cb) {
    const Logger = Container.get('logger');
    const RedisInstance = Container.get('redisInstance');
    const cryptoPairModel = Container.get('CryptoPairModel');
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    const publishServiceInstance = Container.get(PublishService);
    const producerService = Container.get('jobLiveMarketPairBinance');
    const binanceServiceInstance = Container.get(BinanceService);
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
    try {
      const result:any = await binanceServiceInstance.exchangeInfo();
      let listCrypto: any = result.data['symbols'];
      for (let i = 0; i < listCrypto.length; i++){
        let cryptoItem: any = listCrypto[i];
        let status = 1;
        if(cryptoItem.status == 'BREAK'){
          status = 0;
        }
        // @ts-ignore
        let cryptoMarketItem = await cryptoPairModel.findOne({
          where: {
            symbol: cryptoItem.symbol,
            market: 'binance'
          }
        });

        // @ts-ignore
        let cryptoExchangeItem = await cryptoExchangeModel.findOne({
          where: {
            slug: 'binance',
          }
        });
        if(!cryptoMarketItem){
          // @ts-ignore
          cryptoMarketItem = await cryptoPairModel.create({
            symbol: cryptoItem.symbol,
            baseAsset: cryptoItem.baseAsset,
            quoteAsset: cryptoItem.quoteAsset,
            config: cryptoItem,
            status,
            market: 'binance',
            marketUrl: `https://www.binance.com/en/trade/${cryptoItem.baseAsset.toUpperCase()}_${cryptoItem.quoteAsset.toUpperCase()}`,
            statusMarket: cryptoItem.status,
            exchangeId: cryptoExchangeItem.id,
            exchangeName: cryptoExchangeItem.name,
            exchangeSlug: cryptoExchangeItem.slug,
            category: 'spot',
            feeType: 'percentage'
          });
        }
        if(i<300){
          // @ts-ignore
          let job = await producerService.add({
            symbol: cryptoItem.symbol,
            quoteAsset: cryptoItem.quoteAsset,
            baseAsset: cryptoItem.baseAsset,
            exchangeId: cryptoExchangeItem.id,
            marketPairId: cryptoMarketItem.id,
          });

          // @ts-ignore
          await cryptoPairModel.update({
            jobId: job.id,
          }, {
            where: {id: cryptoMarketItem.id}
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
