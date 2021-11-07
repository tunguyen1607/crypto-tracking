import { Container } from 'typedi';
import PublishService from '../services/publish';
import AWSService from '../services/aws';
import { getBeginningOfDate, getPreviousMonthOfDate } from '../helpers/date';
import axios from 'axios';

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
      let { id, sourceId, symbol } = object;
      console.log(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?id=${sourceId}`);
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?id=${sourceId}`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let detail = result.data['data'];
      let body = {
        sourceId,
        logo: await awsServiceInstance.reuploadImage(detail[sourceId].logo),
        tags: detail[sourceId].tags,
        category: detail[sourceId].category,
        urls: detail[sourceId].urls,
        twitterUsername: detail[sourceId].twitter_username,
        subreddit: detail[sourceId].subreddit,
        notice: detail[sourceId].notice,
        isHidden: detail[sourceId].is_hidden,
        platform: detail[sourceId].platform,
      };
      // @ts-ignore
      await cryptoModel.update(body, { where: { id } });
      // @ts-ignore
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
