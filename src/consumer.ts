import 'reflect-metadata'; // We need this in order to use @Decorators

async function startServer() {
  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({ kafka: true, consumer: true });
  process.setMaxListeners(0);
}

startServer();
