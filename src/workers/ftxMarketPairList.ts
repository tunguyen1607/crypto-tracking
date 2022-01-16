import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import {urlSlug} from "../helpers/crawler";
import BinanceService from '../services/binance';

export default {
  queueName: 'crypto_ftx_handle_list_pair',
  status: true,
  run: async function(message, cb) {
    const Logger = Container.get('logger');
    const cryptoPairModel = Container.get('CryptoPairModel');
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    const producerService = Container.get('jobLiveMarketPairFTX');
    const publishServiceInstance = Container.get(PublishService);
    try {
      const result = await axios({
        method: 'GET',
        url: `https://ftx.com/api/markets`,
      });
      let list: any = result.data['result'];
      for (let i = 0; i < list.length; i++){
        let cryptoItem: any = list[i];
        let status = 1;
        // @ts-ignore
        let cryptoMarketItem = await cryptoPairModel.findOne({
          where: {
            symbol: cryptoItem.baseCurrency && cryptoItem.quoteCurrency ? cryptoItem.baseCurrency.toUpperCase()+cryptoItem.quoteCurrency.toUpperCase() : cryptoItem.name,
            market: 'ftx'
          }
        });

        // @ts-ignore
        let cryptoExchangeItem = await cryptoExchangeModel.findOne({
          where: {
            slug: 'ftx',
          }
        });
        if(!cryptoMarketItem){
          // @ts-ignore
          cryptoMarketItem = await cryptoPairModel.create({
            symbol: cryptoItem.baseCurrency && cryptoItem.quoteCurrency ? cryptoItem.baseCurrency.toUpperCase()+cryptoItem.quoteCurrency.toUpperCase() : cryptoItem.name,
            marketPair: cryptoItem.name,
            baseAsset: cryptoItem.baseCurrency,
            quoteAsset: cryptoItem.quoteCurrency,
            price: cryptoItem.price,
            priceChange: cryptoItem.change24h,
            baseVolume: cryptoItem.quoteVolume24h,
            usdVolume: cryptoItem.volumeUsd24h,
            config: {
              underlying: cryptoItem.underlying,
              restricted: cryptoItem.restricted,
              highLeverageFeeExempt: cryptoItem.highLeverageFeeExempt,
            },
            status,
            market: 'ftx',
            marketUrl: `https://ftx.com/trade/${cryptoItem.name}`,
            exchangeId: cryptoExchangeItem.id,
            exchangeName: cryptoExchangeItem.name,
            exchangeSlug: cryptoExchangeItem.slug,
            category: cryptoItem.type,
            statusMarket: 'TRADE',
            lastUpdate: new Date(),
            feeType: 'percentage',
          });
        }
        if(cryptoItem.quoteCurrency == "USD" && cryptoItem.type == 'spot'){
          // @ts-ignore
          let job = await producerService.add({
            symbol: cryptoItem.name,
            marketPair: cryptoItem.name,
            quoteAsset: cryptoItem.quoteCurrency,
            baseAsset: cryptoItem.baseCurrency,
            exchangeId: cryptoExchangeItem.id,
            marketPairId: cryptoMarketItem.id,
          });
          if(!cryptoMarketItem.logo){
            await publishServiceInstance.publish('', 'crypto_handle_detail_coinmarketcap', {
              symbol: cryptoItem.baseCurrency,
              marketPairId: cryptoMarketItem.id,
              marketPair: cryptoItem.baseCurrency + '/' + cryptoItem.quoteCurrency,
              slug: urlSlug(cryptoExchangeItem.slug + ' ' + cryptoItem.baseCurrency.toLowerCase()),
              marketData: {
                exchangeId:  cryptoExchangeItem.id,
                exchangeName: cryptoExchangeItem.name,
                exchangeSlug: cryptoExchangeItem.slug,
              }
            });
          }
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
