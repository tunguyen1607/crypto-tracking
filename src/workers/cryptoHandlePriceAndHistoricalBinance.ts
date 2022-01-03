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
      if(!ticker){
        ticker = await getAsync(symbol.toLowerCase()+'_to_usdt_ticker');
      }
      if(ticker && isStringJson(ticker)){
        ticker = JSON.parse(ticker);
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
        let date = timeConverter(Math.ceil(priceObject.timestamp/1000), false);
        // @ts-ignore
        cryptoHistoricalModel.create({
          cryptoId: cryptoDetail.id,
          status: 1,
          timestamp: Math.ceil(priceObject.timestamp/1000),
          date,
          sourceId: cryptoDetail.sourceId,
          timeOpen: ticker && checkValidDate(ticker.openTime) ? new Date(ticker.openTime) : null,
          timeClose: ticker && checkValidDate(ticker.closeTime) ? new Date(ticker.closeTime) : null,
          timeHigh: priceObject && checkValidDate(priceObject.highPriceTimestamp) ? new Date(priceObject.highPriceTimestamp) : null,
          timeLow: priceObject && checkValidDate(priceObject.lowPriceTimestamp) ? new Date(priceObject.lowPriceTimestamp) : null,
          priceOpen:  ticker && ticker && ticker.openPrice ? ticker.openPrice : null,
          priceClose: priceObject && priceObject.price ? priceObject.price : null,
          priceLow: ticker && ticker.lowPrice ? ticker.lowPrice : null,
          priceHigh: ticker && ticker.highPrice ? ticker.highPrice : null,
          volume: ticker && ticker.count ? parseFloat(priceObject.price) * parseInt(ticker.count) : null,
          marketCap: parseFloat(priceObject.price) * parseFloat(cryptoDetail.circulatingSupply),
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
          volume: ticker && ticker.count ? parseFloat(priceObject.price) * parseInt(ticker.count) : null,
          marketCap: parseFloat(priceObject.price) * parseFloat(cryptoDetail.circulatingSupply),
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
