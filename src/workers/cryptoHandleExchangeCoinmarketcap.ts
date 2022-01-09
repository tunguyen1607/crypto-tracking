import { Container } from 'typedi';
import PublishService from '../services/publish';
import { urlSlug } from '../helpers/crawler';
import axios from 'axios';
import AWSService from "../services/aws";

const blockingWait = function(seconds) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      console.log('wait for %s seconds', seconds);
      return resolve(true);
    }, seconds * 1000);
  });
};

export default {
  queueName: 'crypto_handle_exchange_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    const awsServiceInstance = Container.get(AWSService);
    try {
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/exchange/map`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let list: any = result.data['data'];
      for (let i = 0; i < list.length; i++) {
        await blockingWait(5);
        let exchangeDetail: any = list[i];
        console.log(`https://pro-api.coinmarketcap.com/v1/exchange/info?id=${exchangeDetail.id}`)
        let exchangeDetailRs = await axios({
          method: 'GET',
          url: `https://pro-api.coinmarketcap.com/v1/exchange/info?id=${exchangeDetail.id}`,
          headers: {
            'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
          },
        });
        let detailExchange: any = exchangeDetailRs.data['data'];
        console.log(detailExchange);
        let exchangeItem: any = detailExchange[exchangeDetail.id];
        let bodyExchange = {
          name: exchangeItem.name,
          slug: exchangeItem.slug,
          dateLaunched: exchangeItem.date_launched,
          urls: exchangeItem.urls,
          fiats: exchangeItem.fiats,
          countries: exchangeItem.countries,
          tags: exchangeItem.tags,
          type: exchangeItem.type,
          is_hidden: exchangeItem.is_hidden,
          is_redistributable: exchangeItem.is_redistributable,
          maker_fee: exchangeItem.maker_fee,
          taker_fee: exchangeItem.taker_fee,
          spot_volume_usd: exchangeItem.spot_volume_usd,
          spot_volume_last_updated: exchangeItem.spot_volume_last_updated,
          status: exchangeDetail.status,
          is_active: exchangeDetail.is_active,
          sourceId: exchangeDetail.id+''
        };
        // @ts-ignore
        let cryptoDetail = await cryptoExchangeModel.findOne({
          where: { sourceId: exchangeDetail.id + '', slug: exchangeItem.slug },
        });
        if (cryptoDetail) {
          // @ts-ignore
          await cryptoExchangeModel.update(bodyExchange, {
            where: { sourceId: exchangeItem.id + '', slug: exchangeItem.slug },
          });
          bodyExchange['id'] = cryptoDetail.id;
          cryptoDetail = bodyExchange;
        } else {
          console.log({ sourceId: exchangeItem.id + '', slug: exchangeItem.slug });
          bodyExchange['logo'] = await awsServiceInstance.reuploadImage(exchangeItem.logo),
          // @ts-ignore
          cryptoDetail = await cryptoExchangeModel.create(bodyExchange);
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
