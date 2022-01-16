import { Container } from 'typedi';
import PublishService from '../services/publish';
import AWSService from '../services/aws';
import {urlSlug} from '../helpers/crawler';
import { getBeginningOfDate, getPreviousMonthOfDate } from '../helpers/date';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_detail_coinranking',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const awsServiceInstance = Container.get(AWSService);
    const cryptoMarketModel = Container.get('cryptoMarketModel');
    try {
      let { id, sourceId, symbol } = object;
      const result = await axios({
        method: 'GET',
        url: 'https://coinranking1.p.rapidapi.com/coin/'+sourceId,
        headers: {
          'x-rapidapi-host': 'coinranking1.p.rapidapi.com',
          'x-rapidapi-key': 'fb9eb1dc10msheabca5016ca1708p15c934jsnbe80cc2afd88'
        }
      });
      let detail: any = result.data['data'];
      detail['coin'].symbol = detail['coin'].symbol.replace(/[^a-zA-Z ]/g, "");
      if(!detail){
        throw new Error('empty data '+ JSON.stringify(result.data));
      }
      let body = {
        sourceId: detail['coin'].id,
        symbol: detail['coin'].symbol,
        slug: urlSlug(detail['coin'].name),
        name: detail['coin'].name,
        logo: await awsServiceInstance.reuploadImage(detail['coin'].iconUrl),
        category: detail['coin'].type,
        urls: detail['coin'].links,
        status: 1,
        dateAdded: new Date(detail['coin'].firstSeen),
        description: detail['coin'].description,
        source: 'coinranking',
        rank: detail['coin'].rank,
        numberOfMarkets: detail['coin'].numberOfMarkets,
        numberOfExchanges: detail['coin'].numberOfExchanges,
        volume: detail['coin'].volume,
        marketCap: detail['coin'].marketCap,
        price: detail['coin'].price,
        circulatingSupply: detail['coin'].circulatingSupply,
        totalSupply: detail['coin'].totalSupply
      };
      if(id){
        // @ts-ignore
        await cryptoMarketModel.update(body, { where: { id } });
      }else {
        // @ts-ignore
        let cryptoDetail = await cryptoMarketModel.findOne({
          where: { symbol: detail['coin'].symbol, slug: urlSlug(detail['coin'].name) },
        });
        if (cryptoDetail) {
          // @ts-ignore
          await cryptoMarketModel.update(body, {
            where: { sourceId: detail['coin'].id + '', symbol: detail['coin'].symbol, slug: urlSlug(detail['coin'].name) },
          });
        } else {
          // @ts-ignore
          await cryptoMarketModel.create(body);
        }
      }

      // @ts-ignore
    } catch (e) {
      console.log('crypto_handle_detail_coinranking');
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
