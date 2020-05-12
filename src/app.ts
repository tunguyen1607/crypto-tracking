import 'reflect-metadata'; // We need this in order to use @Decorators

import config from './config';

import express from 'express';

import Logger from './loaders/logger';
import EventEmitter from 'events';

async function startServer() {
  const app = express();

  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({ expressApp: app });
  let emitter = new EventEmitter();
  // or 0 to turn off the limit
  emitter.setMaxListeners(0);
  process.setMaxListeners(0);
  app.listen(config.port, err => {
    if (err) {
      Logger.error(err);
      process.exit(1);
      return;
    }
    Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port} 🛡️ 
      ################################################
    `);
  });
}

startServer();
