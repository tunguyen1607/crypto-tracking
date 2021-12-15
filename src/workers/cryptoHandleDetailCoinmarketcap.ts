import { Container } from 'typedi';
import PublishService from '../services/publish';
import AWSService from '../services/aws';
import { getBeginningOfDate, getPreviousMonthOfDate } from '../helpers/date';
import axios from 'axios';
import {urlSlug} from "../helpers/crawler";

export default {
  queueName: 'crypto_handle_detail_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const awsServiceInstance = Container.get(AWSService);
    const cryptoModel = Container.get('cryptoModel');
    try {
      let { id, sourceId, symbol, marketData } = object;
      let queryText = '';
      if(sourceId){
        queryText = `id=${sourceId}`;
      }else if(symbol){
        queryText = `symbol=${symbol}`;
        sourceId = symbol;
      }
      console.log(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?${queryText}&aux=urls,logo,description,tags,platform,date_added,notice,status`);
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?${queryText}&aux=urls,logo,description,tags,platform,date_added,notice,status`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let detail: any = result.data['data'];
      detail[sourceId].symbol = urlSlug(detail[sourceId].symbol);
      if(!detail){
        throw new Error('empty data '+ JSON.stringify(result.data));
      }
      let body = {
        sourceId: detail[sourceId].id,
        symbol: detail[sourceId].symbol,
        slug: detail[sourceId].slug,
        name: detail[sourceId].name,
        logo: await awsServiceInstance.reuploadImage(detail[sourceId].logo),
        tags: detail[sourceId].tags,
        category: detail[sourceId].category,
        urls: detail[sourceId].urls,
        twitterUsername: detail[sourceId].twitter_username,
        subreddit: detail[sourceId].subreddit,
        notice: detail[sourceId].notice,
        isHidden: detail[sourceId].is_hidden,
        platform: detail[sourceId].platform,
        circulatingSupply: detail[sourceId].self_reported_circulating_supply,
        status: detail[sourceId].status == 'active' ? 1 : 0,
        dateAdded: detail[sourceId].date_added,
        description: detail[sourceId].description,
        source: 'coinmarketcap'
      };
      body = {...body, ...marketData};
      if(id){
        // @ts-ignore
        await cryptoModel.update(body, { where: { id } });
      }else {
        // @ts-ignore
        let cryptoDetail = await cryptoModel.findOne({
          where: { symbol: detail[sourceId].symbol, slug: detail[sourceId].slug },
        });
        if (cryptoDetail) {
          // @ts-ignore
          await cryptoModel.update(body, {
            where: { sourceId: detail[sourceId].id + '', symbol: detail[sourceId].symbol, slug: detail[sourceId].slug },
          });
        } else {
          // @ts-ignore
          cryptoDetail = await cryptoModel.create(body);
        }
        await publishServiceInstance.publish('', 'crypto_handle_list_historical_coinmarketcap', {
          sourceId: cryptoDetail.sourceId,
          id: cryptoDetail.id,
          symbol: cryptoDetail.symbol,
          startTimestampHistorical: cryptoDetail.startTimestampHistorical,
          lastTimestampHistorical: cryptoDetail.lastTimestampHistorical,
        });
      }

      // @ts-ignore
    } catch (e) {
      console.log('crypto_handle_detail_coinmarketcap');
      if (e.response && e.response.statusText) {
        console.error(e.response.data);
      } else {
        console.error(e);
      }
    } finally {
      cb(true);
    }
  },
};
