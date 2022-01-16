import { Container } from 'typedi';
import { promisify } from 'util';
import { Job } from 'bull';

export default class WatchPriceCryptoBinance {
  public async handler(job, done): Promise<void> {
    const Logger = Container.get('logger');
    const cryptoMarketModel = Container.get('cryptoMarketModel');
    const RedisInstance = Container.get('redisInstance');
    const producerService = Container.get('jobLivePriceBinance');
    try {
      // @ts-ignore
      let listCryptoMarkets = await cryptoMarketModel.findAll({
        where: {
          market: 'binance',
          statusMarket: 'TRADING'
        },
        limit: 10,
        order: [
          ['rank', 'ASC'],
          ['name', 'ASC'],
        ],
      });
      for (let i = 0; i < listCryptoMarkets.length; i++) {
        let cryptoDetail = listCryptoMarkets[i];
        if(cryptoDetail && cryptoDetail.symbol){
          if (cryptoDetail.jobId) {
            // @ts-ignore
            const resJob = await producerService.getJob(cryptoDetail.jobId) as Job;
            if (resJob) {
              if(await resJob.isActive() || await resJob.isWaiting() || await resJob.isDelayed()){
                console.log('skip '+ cryptoDetail.symbol.toLowerCase())
                continue;
              }
              if(await resJob.isStuck() || await resJob.isPaused()){
                await resJob.moveToFailed({message: 'no need to process'});
              }
            }
          }
          // @ts-ignore
          let job = await producerService.add({
            symbols: cryptoDetail.symbol.toLowerCase(),
            cryptoId: cryptoDetail.id
          });
          // @ts-ignore
          await cryptoMarketModel.update({jobId: job.id}, {where: {id: cryptoDetail.id}});
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
