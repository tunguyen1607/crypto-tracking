import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import {urlSlug} from "../helpers/crawler";
import BinanceService from '../services/binance';

export default {
  queueName: 'crypto_binance_handle_list_pair',
  status: true,
  run: async function(message, cb) {
    const Logger = Container.get('logger');
    const cryptoPairModel = Container.get('CryptoPairModel');
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    const producerService = Container.get('jobLiveMarketPairBinance');
    const binanceServiceInstance = Container.get(BinanceService);
    const publishServiceInstance = Container.get(PublishService);
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
            marketPair: cryptoItem.baseAsset + '/' + cryptoItem.quoteAsset,
            baseAsset: cryptoItem.baseAsset,
            quoteAsset: cryptoItem.quoteAsset,
            config: cryptoItem,
            status,
            market: 'binance',
            marketUrl: `https://www.binance.com/en/trade/${cryptoItem.baseAsset.toUpperCase()}_${cryptoItem.quoteAsset.toUpperCase()}`,
            statusMarket: cryptoItem.status,
            priceChange: cryptoItem.priceChange,
            priceChangePercent: cryptoItem.priceChangePercent,
            baseVolume: cryptoItem.volume,
            quoteVolume: cryptoItem.quoteVolume,
            exchangeId: cryptoExchangeItem.id,
            exchangeName: cryptoExchangeItem.name,
            exchangeSlug: cryptoExchangeItem.slug,
            category: 'spot',
            feeType: 'percentage',
          });
        }
        if(cryptoItem.quoteAsset == "USDT"){
          // @ts-ignore
          let job = await producerService.add({
            symbol: cryptoItem.symbol,
            marketPair: cryptoItem.symbol,
            quoteAsset: cryptoItem.quoteAsset,
            baseAsset: cryptoItem.baseAsset,
            exchangeId: cryptoExchangeItem.id,
            marketPairId: cryptoMarketItem.id,
          });

          await publishServiceInstance.publish('', 'crypto_handle_detail_coinmarketcap', {
            symbol: cryptoItem.baseAsset,
            marketPairId: cryptoMarketItem.id,
            marketPair: cryptoItem.baseAsset + '/' + cryptoItem.quoteAsset,
            slug: urlSlug(cryptoExchangeItem.slug + ' ' + cryptoItem.baseAsset.toLowerCase()),
            marketData: {
              exchangeId:  cryptoExchangeItem.id,
              exchangeName: cryptoExchangeItem.name,
              exchangeSlug: cryptoExchangeItem.slug,
              market: 'binance'
            }
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
      Logger.error('???? Error with Email Sequence Job: %o', e);
    }finally {
      cb(true);
    }
  },
};
