import { Container } from 'typedi';
import PublishService from '../services/publish';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_list_news_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const cryptoNewModel = Container.get('cryptoNewModel');
    if(!object.sourceId || !object.id){
      return cb(true);
    }
    try {
      const result = await axios({
        method: 'GET',
        url: `https://api.coinmarketcap.com/content/v3/news?coins=${object.sourceId}&page=1&size=100`,
      });
      let list: any = result.data['data'];
      for (let i = 0; i < list.length; i++) {
        let cryptoNew: any = list[i];
        let body = {
          sourceName: cryptoNew.meta.sourceName,
          cryptoSourceId: object.sourceId,
          cryptoId: object.id,
          title: cryptoNew.meta.title,
          subtitle: cryptoNew.meta.subtitle,
          slug: cryptoNew.slug,
          content: cryptoNew.meta.content ? cryptoNew.meta.content : null,
          cover: cryptoNew.cover,
          maxChar: cryptoNew.meta.maxChar,
          language: cryptoNew.meta.language,
          sourceUrl: cryptoNew.meta.sourceUrl,
          type: cryptoNew.meta.type,
          visibility: cryptoNew.meta.visibility,
          status: cryptoNew.meta.status,
          createdAt: cryptoNew.createdAt,
          updatedAt: cryptoNew.meta.updatedAt,
          releasedAt: cryptoNew.meta.releasedAt,
        };
        console.log(body);
        // @ts-ignore
        let cryptoDetail = await cryptoNewModel.findOne({
          where: { slug: cryptoNew.slug, cryptoId: object.id },
        });
        if (!cryptoDetail) {
          // @ts-ignore
          cryptoDetail = await cryptoNewModel.create(body);
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
