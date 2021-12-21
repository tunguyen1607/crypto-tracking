import { Container } from 'typedi';
import { promisify } from 'util';
import { Job } from 'bull';
import publish from "../services/publish";

export default class WatchPriceCryptoBinance {
  public async handler(job, done): Promise<void> {
    const Logger = Container.get('logger');
    const cryptoModel = Container.get('cryptoModel');
    const producerService = Container.get(publish);

    try {
      // @ts-ignore
      let listCrypto = await cryptoModel.findAll({
        where: {
          status: 1,
          source: 'coinmarketcap'
        },
        limit: 100,
        order: [
          ['rank', 'ASC'],
          ['name', 'ASC'],
        ],
      });
      for (let i = 0; i < listCrypto.length; i++) {
        let cryptoDetail = listCrypto[i];
        if(cryptoDetail && cryptoDetail.sourceId){
          // @ts-ignore
          await producerService.publish('', 'crypto_handle_list_news_coinmarketcap', {
            sourceId: cryptoDetail.sourceId,
            id: cryptoDetail.id,
          });
        }
      }
      done();
    } catch (e) {
      // @ts-ignore
      Logger.error('🔥 Error with Email Sequence Job: %o', e);
      done(e);
    }
  }
}
