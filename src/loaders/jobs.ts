import config from '../config';
import EmailSequenceJob from '../jobs/emailSequence';
import WatchPriceBTC from '../jobs/watchPriceBTC';
import Agenda from 'agenda';

export default ({ agenda }: { agenda: Agenda }) => {
  agenda.define(
    'send-email',
    { priority: 'high', concurrency: config.agenda.concurrency },
    // @TODO Could this be a static method? Would it be better?
    new EmailSequenceJob().handler,
  );
  // new WatchPriceBTC().handler().then(function(ok) {
  //   console.log(ok);
  // });
  agenda.start();
};
