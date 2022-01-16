import { Container } from 'typedi';
import PublishService from '../services/publish';
import AWSService from '../services/aws';
import { getBeginningOfDate, getPreviousMonthOfDate } from '../helpers/date';
import {urlSlug} from "../helpers/crawler";
import superagent from "superagent";

export default {
  queueName: 'crypto_handle_detail_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const awsServiceInstance = Container.get(AWSService);
    const cryptoMarketModel = Container.get('cryptoMarketModel');
    try {
      let { id, sourceId, symbol, marketData, marketPairId, marketPair, slug } = object;
      let queryText = '';
      if(sourceId){
        queryText = `id=${sourceId}`;
      }else if(symbol){
        queryText = `symbol=${symbol}`;
        sourceId = symbol;
      }
      console.log(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?${queryText}&aux=urls,logo,description,tags,platform,date_added,notice,status`);
      let result = await superagent.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?${queryText}&aux=urls,logo,description,tags,platform,date_added,notice,status`).set( {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        });

      if(result){
        let detail: any = result.body['data'];
        detail[sourceId].symbol = urlSlug(detail[sourceId].symbol);
        if(!detail){
          throw new Error('empty data '+ JSON.stringify(result.data));
        }
        let body = {
          sourceId: detail[sourceId].id,
          symbol: symbol,
          slug: slug ? slug : detail[sourceId].slug,
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
          source: 'coinmarketcap',
          lastUpdated: new Date(),
        };
        body = {...body, ...marketData};
        if(id){
          // @ts-ignore
          let cryptoDetail = await cryptoMarketModel.findOne({
            where: { id },
          });
          if (cryptoDetail) {
            if(cryptoDetail.description){
              delete body['description'];
            }
            if(cryptoDetail.marketPairIds && marketPairId){
              body['marketPairIds'] = [...cryptoDetail.marketPairIds, ...[marketPairId]].filter((v, i, a) => a.indexOf(v) === i);
            }
            if(cryptoDetail.marketPairs && marketPair){
              body['marketPairs'] = [...cryptoDetail.marketPairs, ...[marketPair]].filter((v, i, a) => a.indexOf(v) === i);
            }
            // @ts-ignore
            await cryptoMarketModel.update(body, { where: { id } });
          } else {
            if(marketPairId){
              body['marketPairIds'] = [marketPairId];
            }
            if(marketPair){
              body['marketPairs'] = [marketPair];
            }
            // @ts-ignore
            await cryptoMarketModel.create(body);
          }
        }else {
          console.log({ symbol: symbol, slug: slug ? slug : detail[sourceId].slug });
          // @ts-ignore
          let cryptoDetail = await cryptoMarketModel.findOne({
            where: { symbol: symbol, slug: slug ? slug : detail[sourceId].slug },
          });
          if (cryptoDetail) {
            if(cryptoDetail.description){
              delete body['description'];
            }
            if(cryptoDetail.marketPairIds && marketPairId){
              body['marketPairIds'] = [...cryptoDetail.marketPairIds, ...[marketPairId]].filter((v, i, a) => a.indexOf(v) === i);
            }
            if(cryptoDetail.marketPairs && marketPair){
              body['marketPairs'] = [...cryptoDetail.marketPairs, ...[marketPair]].filter((v, i, a) => a.indexOf(v) === i);
            }
            // @ts-ignore
            await cryptoMarketModel.update(body, {
              where: { sourceId: detail[sourceId].id + '', symbol: detail[sourceId].symbol, slug: detail[sourceId].slug },
            });
          } else {
            if(marketPairId){
              body['marketPairIds'] = [marketPairId];
            }
            if(marketPair){
              body['marketPairs'] = [marketPair];
            }
            // @ts-ignore
            await cryptoMarketModel.create(body);
          }
        }
      }

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
