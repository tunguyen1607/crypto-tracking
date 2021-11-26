import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';
import {promisify} from "util";

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
      let { symbol, type } = object;
      if(!symbol){
        throw new Error('not found symbol');
      }
      // @ts-ignore
      let cryptoDetail = await cryptoModel.findOne({where: {symbol}});
      // @ts-ignore
      await cryptoModel.update({
        price: await getAsync(symbol.toLowerCase()+'_current_price'),
      }, {where: {id: cryptoDetail.id}});
      if(!cryptoDetail){
        throw new Error('not found crypto with symbol '+symbol);
      }
    } catch (e) {
      // @ts-ignore
      Logger.error('🔥 Error with queue crypto_handle_price_and_historical_binance: %o', e);
    }finally {
      cb(true);
    }
  },
};
