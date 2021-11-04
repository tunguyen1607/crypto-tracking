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
      let listCrypto = [];
      for (let i = 0; i < list.length; i++) {
        let cryptoItem: any = list[i];
        listCrypto.push({
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
          sourceId: cryptoItem.id,
          source: 'coinmarketcap',
          status: 1,
          fullyDilutedMarketCap: cryptoItem.quote.USD.fully_diluted_market_cap,
        });
      }
      // @ts-ignore
      await cryptoModel.bulkCreate(listCrypto);
      console.log(list);
      console.log(list[0]['quote']);
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
