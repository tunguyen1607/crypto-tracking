import { Container } from 'typedi';
import PublishService from '../services/publish';
import {promisify} from "util";

export default {
  queueName: 'cleanUp_market_pair_historical',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    const Logger = Container.get('logger');
    const cryptoHistoricalTimeModel = Container.get('CryptoPairHistoricalTimeModel');
    try {
      let { marketPairId, exchangeId } = object;
      if(!marketPairId || !exchangeId){
        throw new Error('not found marketPairId or exchangeId')
      }
      let typeArr = [
        '1d', '1w', '1M', '3m', '5m', '15m', '30m', '4h', '6h', '8h', '12h', '1h', '1m'
      ];
      for(let i = 0; i < typeArr.length; i++){
        // @ts-ignore
        let countHistoricalType = await cryptoHistoricalTimeModel.count({where: {marketPairId, exchangeId, type: typeArr[i]}});
        if(countHistoricalType > 400){
          let leftover = countHistoricalType - 400;
          // @ts-ignore
          await cryptoHistoricalTimeModel.destroy({
            where: {marketPairId, exchangeId, type: typeArr[i]},
            order: [
              ['timestamp', 'ASC'],
            ],
            limit: leftover
          })
        }
      }
    } catch (e) {
      // @ts-ignore
      Logger.error('🔥 Error with queue crypto_handle_price_and_historical_binance: %o', e);
    }finally {
      cb(true);
    }
  },
};
