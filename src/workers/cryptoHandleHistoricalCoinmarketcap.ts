import { Container } from 'typedi';
import PublishService from '../services/publish';
import { getBeginningOfDate, getPreviousMonthOfDate } from '../helpers/date';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_list_historical_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const cryptoModel = Container.get('cryptoModel');
    const cryptoHistoricalModel = Container.get('cryptoHistoricalModel');
    try {
      let { id, sourceId, startTimestampHistorical, lastTimestampHistorical } = object;
      let startTimestamp =
        getPreviousMonthOfDate(getBeginningOfDate()) > startTimestampHistorical
          ? getBeginningOfDate()
          : lastTimestampHistorical;
      let lastTimestamp = getPreviousMonthOfDate(startTimestamp, 4);
      console.log(
        `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/historical?id=${sourceId}&convertId=2781&timeStart=${lastTimestamp}&timeEnd=${startTimestamp}`,
      );
      const result = await axios({
        method: 'GET',
        url: `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/historical?id=${sourceId}&convertId=2781&timeStart=${lastTimestamp}&timeEnd=${startTimestamp}`,
      });
      if (result.data && result.data['data']) {
        let list: any = result.data['data']['quotes'];
        for (let i = 0; i < list.length; i++) {
          let historicalItem = list[i];
          let date = historicalItem.quote.timestamp;
          console.log(historicalItem);
          let timestamp = Math.ceil(new Date(date).getTime() / 1000);
          console.log(new Date(date));
          console.log(timestamp);
          let body = {
            cryptoId: id,
            status: 1,
            timestamp,
            date,
            sourceId,
            timeOpen: historicalItem.timeOpen,
            timeClose: historicalItem.timeClose,
            timeHigh: historicalItem.timeHigh,
            timeLow: historicalItem.timeLow,
            priceOpen: historicalItem.quote.open,
            priceClose: historicalItem.quote.close,
            priceLow: historicalItem.quote.low,
            priceHigh: historicalItem.quote.high,
            volume: historicalItem.quote.volume,
            marketCap: historicalItem.quote.marketCap,
          };
          // @ts-ignore
          let cryptoDetail = await cryptoHistoricalModel.findOne({
            where: { sourceId: sourceId + '', cryptoId: id, timestamp, date },
          });
          if (cryptoDetail) {
            // @ts-ignore
            cryptoDetail = await cryptoHistoricalModel.update(body, {
              where: { sourceId: sourceId + '', cryptoId: id, timestamp, date },
            });
          } else {
            // @ts-ignore
            cryptoDetail = await cryptoHistoricalModel.create(body);
          }
        }
        let bodyCrypto = {
          lastTimestampHistorical: lastTimestamp,
        };
        if (getPreviousMonthOfDate(getBeginningOfDate()) > startTimestampHistorical) {
          bodyCrypto['startTimestampHistorical'] = startTimestamp;
        }
        // @ts-ignore
        await cryptoModel.update(bodyCrypto, { where: { id } });
      }

      // @ts-ignore
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
