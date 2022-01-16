import { Container } from 'typedi';
import PublishService from '../services/publish';
import { getBeginningOfDate, getPreviousMonthOfDate, checkValidDate } from '../helpers/date';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_list_historical_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const cryptoMarketModel = Container.get('cryptoMarketModel');
    const cryptoHistoricalModel = Container.get('cryptoHistoricalModel');
    try {
      let { id, sourceId, startTimestampHistorical, lastTimestampHistorical } = object;
      let startTimestamp =
        startTimestampHistorical && getPreviousMonthOfDate(getBeginningOfDate()) < startTimestampHistorical
          ? lastTimestampHistorical
          : getBeginningOfDate();
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
          let timestamp = Math.ceil(new Date(date).getTime() / 1000);
          let body = {
            cryptoId: id,
            status: 1,
            timestamp,
            date,
            sourceId,
            timeOpen: checkValidDate(historicalItem.timeOpen) ? historicalItem.timeOpen : null,
            timeClose: checkValidDate(historicalItem.timeClose) ? historicalItem.timeClose : null,
            timeHigh: checkValidDate(historicalItem.timeHigh) ? historicalItem.timeHigh : null,
            timeLow: checkValidDate(historicalItem.timeLow) ? historicalItem.timeLow : null,
            priceOpen: historicalItem.quote && historicalItem.quote.open ? historicalItem.quote.open : null,
            priceClose: historicalItem.quote && historicalItem.quote.close ? historicalItem.quote.close : null,
            priceLow: historicalItem.quote && historicalItem.quote.low ? historicalItem.quote.low : null,
            priceHigh: historicalItem.quote && historicalItem.quote.high ? historicalItem.quote.high : null,
            volume: historicalItem.quote && historicalItem.quote.volume ? historicalItem.quote.volume : null,
            marketCap: historicalItem.quote && historicalItem.quote.marketCap ? historicalItem.quote.marketCap : null,
          };
          console.log(historicalItem);
          console.log(body);
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
        await cryptoMarketModel.update(bodyCrypto, { where: { id } });
      }

      // @ts-ignore
    } catch (e) {
      console.log('crypto_handle_list_historical_coinmarketcap');
      if (e.response && e.response.statusText) {
        console.error(e.response.statusText);
      } else {
        console.error(e);
      }
    } finally {
      cb(true);
    }
  },
};
