import 'reflect-metadata'; // We need this in order to use @Decorators
import EventEmitter from 'events';

async function startServer() {


  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({expressApp: true, rabbitmq: true, socketIO: true});
  let emitter = new EventEmitter();
  // or 0 to turn off the limit
  emitter.setMaxListeners(0);
  process.setMaxListeners(0);

}

startServer();
