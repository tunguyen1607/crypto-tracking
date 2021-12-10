import { Container } from 'typedi';
import { promisify } from 'util';
import { Job } from 'bull';

export default class WatchPriceCryptoBinance {
  public async handler(job, done): Promise<void> {
    const Logger = Container.get('logger');
    const cryptoModel = Container.get('cryptoModel');
    const RedisInstance = Container.get('redisInstance');
    const producerService = Container.get('jobLivePriceBinance');
    try {
      // @ts-ignore
      let listCryptoMarkets = await cryptoModel.findAll({
        where: {
          market: 'binance',
          statusMarket: 'TRADING'
        },
        limit: 1000
      });
      console.log(listCryptoMarkets);
      for (let i = 0; i < listCryptoMarkets.length; i++) {
        let cryptoDetail = listCryptoMarkets[i];
        console.log(cryptoDetail.symbol);
        if(cryptoDetail && cryptoDetail.symbol){
          if (cryptoDetail.jobId) {
            // @ts-ignore
            const resJob = await producerService.getJob(cryptoDetail.jobId) as Job;
            console.log(resJob);
            if (resJob && (await resJob.isActive() || await resJob.isWaiting() || await resJob.isDelayed())) {
              console.log('skip '+ cryptoDetail.symbol.toLowerCase())
              continue;
            }
          }
          // @ts-ignore
          let job = await producerService.add({
            symbols: cryptoDetail.symbol.toLowerCase(),
          });
          console.log('send symbol '+cryptoDetail.symbol+ ' with job '+job.id);
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
