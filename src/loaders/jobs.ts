import config from '../config';
import WatchPriceCryptoBinance from '../jobs/watchPriceCryptoBinance';
import Agenda from 'agenda';

export default async ({ agenda }: { agenda: Agenda }) => {
  agenda.define(
    'watch-price-binance',
    { priority: 'high', concurrency: config.agenda.concurrency },
    // @TODO Could this be a static method? Would it be better?
    new WatchPriceCryptoBinance().handler
  );
  await agenda.start();
  await agenda.every('2 hours', 'watch-price-binance');
  // new WatchPriceCryptoBinance().handler({job: 'test'}, function (res) {
  //   console.log(res);
  // })
};
