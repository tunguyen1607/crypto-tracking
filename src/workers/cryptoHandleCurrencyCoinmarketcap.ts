import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_currency_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const currencyModel = Container.get('currencyModel');
    try {
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/fiat/map?limit=5000`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let list: any = result.data['data'];
      let listCurrency = [];
      for (let i = 0; i < list.length; i++) {
        let currencyItem: any = list[i];
        let body = {
          name: currencyItem.name,
          symbol: currencyItem.symbol,
          sign: currencyItem.sign,
          slug: currencyItem.symbol.toLowerCase(),
          sourceId: currencyItem.id,
          source: 'coinmarketcap',
          status: 1,
        };
        listCurrency.push(body);
        // @ts-ignore
        let currencyDetail = await currencyModel.findOne({
          where: { sourceId: currencyItem.id + '', symbol: currencyItem.symbol, slug: currencyItem.symbol.toLowerCase() },
        });
        if (currencyDetail) {
          // @ts-ignore
          await currencyModel.update(body, {
            where: {
              sourceId: currencyItem.id + '',
              symbol: currencyItem.symbol,
              slug: currencyItem.slug.toLowerCase(),
            },
          });
        } else {
          // @ts-ignore
          await currencyModel.create(body);
        }
      }
      // @ts-ignore
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
