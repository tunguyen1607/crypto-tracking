import { Container } from 'typedi';
import PublishService from '../services/publish';
import AWSService from '../services/aws';
import {urlSlug} from '../helpers/crawler';
import { getBeginningOfDate, getPreviousMonthOfDate } from '../helpers/date';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_list_coinranking',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const awsServiceInstance = Container.get(AWSService);
    const cryptoMarketModel = Container.get('cryptoMarketModel');
    try {
      let { offset, limit } = object;
      if(!offset){
        offset = 0;
      }
      if(!limit){
        limit = 100;
      }
      const result = await axios({
        method: 'GET',
        url: `https://coinranking1.p.rapidapi.com/coins?limit=${limit}&offset=${offset}`,
        headers: {
          'x-rapidapi-host': 'coinranking1.p.rapidapi.com',
          'x-rapidapi-key': 'fb9eb1dc10msheabca5016ca1708p15c934jsnbe80cc2afd88'
        }
      });
      let list: any = result.data['data'];
      if(!list){
        throw new Error('empty data '+ JSON.stringify(result.data));
      }
      for (let i = 0; i < list['coins'].length; i++) {
        let cryptoItem: any = list['coins'][i];
        cryptoItem.slug = urlSlug(cryptoItem.name + ' ' + cryptoItem.symbol);
        cryptoItem.symbol = cryptoItem.symbol.replace(/[^a-zA-Z ]/g, "");
        let body = {
          sourceId: cryptoItem.id,
          symbol: cryptoItem.symbol,
          slug: urlSlug(cryptoItem.name),
          name: cryptoItem.name,
          logo: await awsServiceInstance.reuploadImage(cryptoItem.iconUrl),
          category: cryptoItem.type,
          urls: cryptoItem.links,
          status: 1,
          dateAdded: new Date(cryptoItem.firstSeen),
          description: cryptoItem.description,
          source: 'coinranking',
          rank: cryptoItem.rank,
          numberOfMarkets: cryptoItem.numberOfMarkets,
          numberOfExchanges: cryptoItem.numberOfExchanges,
          volume: cryptoItem.volume,
          marketCap: cryptoItem.marketCap,
          price: cryptoItem.price,
          circulatingSupply: cryptoItem.circulatingSupply,
          totalSupply: cryptoItem.totalSupply
        };
        // @ts-ignore
        let cryptoDetail = await cryptoMarketModel.findOne({
          where: { symbol: cryptoItem.symbol.toUpperCase() },
        });
        console.log({ symbol: cryptoItem.symbol, slug: cryptoItem.slug, name: cryptoItem.name })
        if (cryptoDetail) {
          delete body['slug'];
          // @ts-ignore
          await cryptoMarketModel.update(body, {
            where: { sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol, slug: cryptoItem.slug },
          });
          body['id'] = cryptoDetail.id;
          body['startTimestampHistorical'] = cryptoDetail.startTimestampHistorical;
          body['lastTimestampHistorical'] = cryptoDetail.lastTimestampHistorical;
          body['logo'] = cryptoDetail.logo;
          cryptoDetail = body;
        } else {
          // @ts-ignore
          cryptoDetail = await cryptoMarketModel.findOne({
            where: { slug: cryptoItem.slug },
          });
          if(!cryptoDetail){
            // @ts-ignore
            cryptoDetail = await cryptoMarketModel.create(body);
          }
        }
        if (!cryptoDetail.logo) {
          await publishServiceInstance.publish('', 'crypto_handle_detail_coinranking', {
            sourceId: cryptoDetail.sourceId,
            id: cryptoDetail.id,
            symbol: cryptoDetail.symbol,
          });
        }
      }

      // @ts-ignore
    } catch (e) {
      console.log('crypto_handle_list_coinranking');
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
