import config from '../config';
import WatchPriceCryptoBinance from '../jobs/watchPriceCryptoBinance';
import WatchNewsCryptoCoinmarketcap from '../jobs/watchNewsCryptoCoinmarketcap';
import Agenda from 'agenda';

export default async ({ agenda }: { agenda: Agenda }) => {
  // agenda.define(
  //   'watch-price-binance',
  //   { priority: 'high', concurrency: config.agenda.concurrency },
  //   // @TODO Could this be a static method? Would it be better?
  //   new WatchPriceCryptoBinance().handler
  // );
  // agenda.define(
  //   'watch-news-coinmarketcap',
  //   { priority: 'high', concurrency: config.agenda.concurrency },
  //   // @TODO Could this be a static method? Would it be better?
  //   new WatchNewsCryptoCoinmarketcap().handler
  // );
  // await agenda.start();
  // await agenda.every('2 hours', 'watch-price-binance');
  // await agenda.every('11:30pm', 'watch-news-coinmarketcap');
  new WatchPriceCryptoBinance().handler({job: 'test'}, function (res) {
    console.log(res);
  })
};
