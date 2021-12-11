import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import {checkValidDate, timeConverter} from "../helpers/date";
import {isStringJson} from "../helpers/object";

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
      let { symbol, type, priceObject, ticker, jobId } = object;
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
      if(priceObject && isStringJson(priceObject)){
        priceObject = JSON.parse(priceObject);
      }
      // @ts-ignore
      await cryptoModel.update({
        price: priceObject.price,
        lastTimeUpdatePrice: Math.ceil(priceObject.timestamp/1000),
        jobId
      }, {where: {id: cryptoDetail.id}});

      if(type == '1day'){
        if(!ticker){
          const result = await axios({
            method: 'GET',
            url: `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`,
          });
          ticker = result.data;
        }
        let date = timeConverter(priceObject.timestamp, false);
        // @ts-ignore
        cryptoHistoricalModel.create({
          cryptoId: cryptoDetail.id,
          status: 1,
          timestamp: Math.ceil(priceObject.timestamp/1000),
          date,
          sourceId: cryptoDetail.sourceId,
          timeOpen: ticker && checkValidDate(ticker.openTime) ? new Date(Math.ceil(ticker.openTime/1000)) : null,
          timeClose: ticker && checkValidDate(ticker.closeTime) ? new Date(Math.ceil(ticker.closeTime/1000)) : null,
          timeHigh: priceObject && checkValidDate(priceObject.highPriceTimestamp) ? new Date(Math.ceil(priceObject.highPriceTimestamp/1000)) : null,
          timeLow: priceObject && checkValidDate(priceObject.lowPriceTimestamp) ? new Date(Math.ceil(priceObject.lowPriceTimestamp/1000)) : null,
          priceOpen:  ticker && ticker && ticker.openPrice ? ticker.openPrice : null,
          priceClose: priceObject && priceObject.price ? priceObject.price : null,
          priceLow: ticker && ticker.lowPrice ? ticker.lowPrice : null,
          priceHigh: ticker && ticker.highPrice ? ticker.highPrice : null,
          volume: ticker && ticker.volume ? ticker.volume : null,
          // marketCap: historicalItem.quote && historicalItem.quote.marketCap ? historicalItem.quote.marketCap : null,
        })
      }else {
        // @ts-ignore
        await cryptoHistoricalTimeModel.create({
          cryptoId: cryptoDetail.id,
          symbol: cryptoDetail.symbol,
          sourceId: cryptoDetail.sourceId,
          datetime: new Date(priceObject.timestamp),
          timestamp: Math.ceil(priceObject.timestamp/1000),
          price: priceObject.price,
          // volume: ticker.volume,
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
