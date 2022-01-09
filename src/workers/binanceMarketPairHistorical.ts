import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";
import {checkValidDate, timeConverter} from "../helpers/date";
import {isStringJson} from "../helpers/object";

export default {
  queueName: 'binance_market_pair_historical',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    const Logger = Container.get('logger');
    const RedisInstance = Container.get('redisInstance');
    const cryptoPairModel = Container.get('CryptoPairModel');
    const cryptoHistoricalModel = Container.get('CryptoPairHistoricalModel');
    const cryptoHistoricalTimeModel = Container.get('CryptoPairHistoricalTimeModel');
    const publishServiceInstance = Container.get(PublishService);
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
    try {
      let { symbol, quoteAsset, baseAsset, marketPairId, exchangeId, type, priceObject, ticker, jobId } = object;
      if(!symbol){
        throw new Error('not found symbol');
      }

      // @ts-ignore
      let cryptoDetail = await cryptoPairModel.findOne({where: {symbol: symbol.toUpperCase()}});
      if(!cryptoDetail){
        throw new Error('not found crypto with symbol '+symbol);
      }
      if(!priceObject){
        priceObject = await getAsync('binance:trade:'+symbol.toLowerCase());
      }
      if(priceObject && isStringJson(priceObject)){
        priceObject = JSON.parse(priceObject);
      }
      if(!ticker){
        ticker = await getAsync('binance:ticker:'+symbol.toLowerCase());
      }
      if(ticker && isStringJson(ticker)){
        ticker = JSON.parse(ticker);
      }
      // @ts-ignore
      await cryptoPairModel.update({
        price: priceObject.price,
        lastTimeUpdatePrice: Math.ceil(priceObject.timestamp/1000),
        jobId
      }, {where: {id: cryptoDetail.id}});

      if(type == '1day'){
        if(!ticker){
          const result = await axios({
            method: 'GET',
            url: `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`,
          });
          ticker = result.data;
        }
        let date = timeConverter(Math.ceil(priceObject.timestamp/1000), false);
        // @ts-ignore
        cryptoHistoricalModel.create({
          marketPairId,
          symbol,
          quoteAsset,
          baseAsset,
          timestamp: Math.ceil(priceObject.timestamp/1000),
          date,
          exchangeId,
          priceChange: ticker && parseFloat(ticker.priceChange) ? parseFloat(ticker.priceChange) : null,
          priceChangePercent: ticker && parseFloat(ticker.priceChangePercent) ? parseFloat(ticker.priceChangePercent) : null,
          timeOpen: ticker && checkValidDate(ticker.openTime) ? new Date(ticker.openTime) : null,
          timeClose: ticker && checkValidDate(ticker.closeTime) ? new Date(ticker.closeTime) : null,
          timeHigh: priceObject && checkValidDate(priceObject.highPriceTimestamp) ? new Date(priceObject.highPriceTimestamp) : null,
          timeLow: priceObject && checkValidDate(priceObject.lowPriceTimestamp) ? new Date(priceObject.lowPriceTimestamp) : null,
          priceOpen:  ticker && ticker && ticker.openPrice ? ticker.openPrice : null,
          priceClose: priceObject && priceObject.price ? priceObject.price : null,
          priceLow: ticker && ticker.lowPrice ? ticker.lowPrice : null,
          priceHigh: ticker && ticker.highPrice ? ticker.highPrice : null,
          volume: ticker && ticker.volume ? parseFloat(ticker.volume) : null,
          quoteVolume: ticker && ticker.quoteVolume ? parseFloat(ticker.quoteVolume) : null,
          market: 'binance',
        })
      }else {
        // @ts-ignore
        await cryptoHistoricalTimeModel.create({
          marketPairId,
          symbol,
          quoteAsset,
          baseAsset,
          exchangeId,
          priceChange24h: ticker && parseFloat(ticker.priceChange) ? parseFloat(ticker.priceChange) : null,
          pricePercent24h: ticker && parseFloat(ticker.priceChangePercent) ? parseFloat(ticker.priceChangePercent) : null,
          datetime: new Date(priceObject.timestamp),
          timestamp: Math.ceil(priceObject.timestamp/1000),
          price: priceObject.price,
          volume: ticker && ticker.volume ? parseFloat(ticker.volume) : null,
          quoteVolume: ticker && ticker.quoteVolume ? parseFloat(ticker.quoteVolume) : null,
          market: 'binance',
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
