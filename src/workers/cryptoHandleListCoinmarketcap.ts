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
      await publishServiceInstance.publish('', 'crypto_handle_currency_coinmarketcap', {});
      await publishServiceInstance.publish('', 'crypto_handle_categories_coinmarketcap', {});
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let list: any = result.data['data'];
      let listCrypto = [];
      for (let i = 0; i < list.length; i++) {
        let cryptoItem: any = list[i];
        let body = {
          name: cryptoItem.name,
          symbol: cryptoItem.symbol,
          slug: cryptoItem.slug,
          dateAdded: cryptoItem.date_added,
          lastUpdated: cryptoItem.last_updated,
          maxSupply: cryptoItem.max_supply,
          circulatingSupply: cryptoItem.circulating_supply,
          totalSupply: cryptoItem.total_supply,
          cmcRank: cryptoItem.cmc_rank,
          tags: cryptoItem.tags,
          platform: cryptoItem.platform,
          price: cryptoItem.quote.USD.price,
          volume24h: cryptoItem.quote.USD.volume_24h,
          volumeChange24h: cryptoItem.quote.USD.volume_change_24h,
          marketCap: cryptoItem.quote.USD.market_cap,
          marketDominance: cryptoItem.quote.USD.market_cap_dominance,
          sourceId: cryptoItem.id+'',
          source: 'coinmarketcap',
          status: 1,
          fullyDilutedMarketCap: cryptoItem.quote.USD.fully_diluted_market_cap,
        };
        listCrypto.push(body);
        // @ts-ignore
        let cryptoDetail = await cryptoModel.findOne({
          where: { sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol, slug: cryptoItem.slug },
        });
        if (cryptoDetail) {
          // @ts-ignore
          await cryptoModel.update(body, {
            where: { sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol, slug: cryptoItem.slug },
          });
          body['id'] = cryptoDetail.id;
          cryptoDetail = body;
        } else {
          // @ts-ignore
          cryptoDetail = await cryptoModel.create(body);
        }
        await publishServiceInstance.publish('', 'crypto_handle_list_historical_coinmarketcap', {
          sourceId: cryptoDetail.id,
          id: cryptoDetail.id,
          symbol: cryptoDetail.symbol,
          startTimestampHistorical: cryptoDetail.startTimestampHistorical,
          lastTimestampHistorical: cryptoDetail.lastTimestampHistorical,
        });
        await publishServiceInstance.publish('', 'crypto_handle_detail_coinmarketcap', {
          sourceId: cryptoDetail.id,
          id: cryptoDetail.id,
          symbol: cryptoDetail.symbol,
        });
        console.log(cryptoDetail.id);
      }
      // @ts-ignore
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
