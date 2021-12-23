import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_list_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const publishServiceInstance = Container.get(PublishService);
    const cryptoModel = Container.get('cryptoModel');

    try {
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let list: any = result.data['data'];
      for (let i = 0; i < list.length; i++) {
        let cryptoItem: any = list[i];
        let body = {
          name: cryptoItem.name,
          symbol: cryptoItem.symbol.toUpperCase(),
          slug: cryptoItem.slug,
          dateAdded: cryptoItem.date_added,
          lastUpdated: cryptoItem.last_updated,
          maxSupply: cryptoItem.max_supply,
          circulatingSupply: cryptoItem.circulating_supply,
          totalSupply: cryptoItem.total_supply,
          rank: cryptoItem.cmc_rank,
          tags: cryptoItem.tags,
          platform: cryptoItem.platform,
          price: cryptoItem.quote.USD.price,
          volume24h: cryptoItem.quote.USD.volume_24h,
          volumeChange24h: cryptoItem.quote.USD.volume_change_24h,
          marketCap: cryptoItem.quote.USD.market_cap,
          marketDominance: cryptoItem.quote.USD.market_cap_dominance,
          sourceId: cryptoItem.id + '',
          source: 'coinmarketcap',
          status: 1,
          fullyDilutedMarketCap: cryptoItem.quote.USD.fully_diluted_market_cap,
        };
        // @ts-ignore
        let cryptoDetail = await cryptoModel.findOne({
          where: { slug: cryptoItem.slug },
        });
        if (cryptoDetail) {
          if(cryptoDetail.symbol.toLowerCase() == cryptoItem.symbol.toLowerCase()){
            // @ts-ignore
            await cryptoModel.update(body, {
              where: { sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol.toUpperCase(), slug: cryptoItem.slug },
            });
            body['id'] = cryptoDetail.id;
            body['startTimestampHistorical'] = cryptoDetail.startTimestampHistorical;
            body['lastTimestampHistorical'] = cryptoDetail.lastTimestampHistorical;
            body['logo'] = cryptoDetail.logo;
            cryptoDetail = body;
          }
        } else {
          // @ts-ignore
          cryptoDetail = await cryptoModel.create(body);
        }
        if (!cryptoDetail.logo) {
          await publishServiceInstance.publish('', 'crypto_handle_detail_coinmarketcap', {
            sourceId: cryptoDetail.sourceId,
            id: cryptoDetail.id,
            symbol: cryptoDetail.symbol.toUpperCase(),
          });
        }
        await publishServiceInstance.publish('', 'crypto_handle_list_historical_coinmarketcap', {
          sourceId: cryptoDetail.sourceId,
          id: cryptoDetail.id,
          symbol: cryptoDetail.symbol.toUpperCase(),
          startTimestampHistorical: null,
          lastTimestampHistorical: null,
        });
      }
      // @ts-ignore
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
