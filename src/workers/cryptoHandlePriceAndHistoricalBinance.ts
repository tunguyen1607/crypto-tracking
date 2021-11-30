import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import {checkValidDate, timeConverter} from "../helpers/date";

export default {
  queueName: 'crypto_handle_price_and_historical_binance',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    const Logger = Container.get('logger');
    const RedisInstance = Container.get('redisInstance');
    const cryptoModel = Container.get('cryptoModel');
    const cryptoHistoricalModel = Container.get('cryptoHistoricalModel');
    const cryptoHistoricalTimeModel = Container.get('cryptoHistoricalTimeModel');
    const publishServiceInstance = Container.get(PublishService);
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
    try {
      let { symbol, type, priceObject } = object;
      if(!symbol){
        throw new Error('not found symbol');
      }
      // @ts-ignore
      let cryptoDetail = await cryptoModel.findOne({where: {symbol: symbol.toUpperCase()}});
      if(!cryptoDetail){
        throw new Error('not found crypto with symbol '+symbol);
      }
      if(!priceObject){
        priceObject = await getAsync(symbol.toLowerCase()+'_to_usdt');
      }
      if(priceObject){
        priceObject = JSON.parse(priceObject);
      }
      // @ts-ignore
      await cryptoModel.update({
        price: priceObject.price,
      }, {where: {id: cryptoDetail.id}});

      if(type == '1day'){
        let date = timeConverter(priceObject.timestamp, false);
        // @ts-ignore
        cryptoHistoricalModel.create({
          cryptoId: cryptoDetail.id,
          status: 1,
          timestamp: Math.ceil(priceObject.timestamp/1000),
          date,
          sourceId: cryptoDetail.sourceId,
          timeOpen: checkValidDate(priceObject.openTimeStamp) ? new Date(Math.ceil(priceObject.openTimeStamp/1000)) : null,
          timeClose: checkValidDate(priceObject.timestamp) ? new Date(Math.ceil(priceObject.timestamp/1000)) : null,
          timeHigh: checkValidDate(priceObject.highPriceTimestamp) ? new Date(Math.ceil(priceObject.highPriceTimestamp/1000)) : null,
          timeLow: checkValidDate(priceObject.lowPriceTimestamp) ? new Date(Math.ceil(priceObject.lowPriceTimestamp/1000)) : null,
          priceOpen: priceObject.openPrice ? priceObject.openPrice : null,
          priceClose: priceObject.price ? priceObject.price : null,
          priceLow: priceObject.lowPrice ? priceObject.lowPrice : null,
          priceHigh: priceObject.highPrice ? priceObject.highPrice : null,
          // volume: historicalItem.quote && historicalItem.quote.volume ? historicalItem.quote.volume : null,
          // marketCap: historicalItem.quote && historicalItem.quote.marketCap ? historicalItem.quote.marketCap : null,
        })
      }else {
        console.log(priceObject);
        // @ts-ignore
        await cryptoHistoricalTimeModel.create({
          cryptoId: cryptoDetail.id,
          symbol: cryptoDetail.symbol,
          sourceId: cryptoDetail.sourceId,
          datetime: new Date(priceObject.timestamp),
          timestamp: Math.ceil(priceObject.timestamp/1000),
          price: priceObject.price,
          volume: priceObject,
          status: 1,
          type: type,
        });
      }
    } catch (e) {
      // @ts-ignore
      Logger.error('🔥 Error with queue crypto_handle_price_and_historical_binance: %o', e);
    }finally {
      cb(true);
    }
  },
};
