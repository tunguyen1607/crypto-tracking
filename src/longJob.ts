import 'reflect-metadata'; // We need this in order to use @Decorators
import throng from 'throng';
import os from 'os';

async function startServer() {
  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({ rabbitmq: true, longJob: true });
  process.setMaxListeners(0);
}

startServer();
// throng({
//   worker: startServer,         // Fn to call in cluster workers (can be async)
//   count: os.cpus().length,        // Number of workers
// })
