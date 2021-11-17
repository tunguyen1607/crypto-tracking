import { Container } from 'typedi';
import WebSocket from 'ws';
import { promisify } from 'util';

export default class WatchPriceBTC {
  public async handler(): Promise<void> {
    const Logger = Container.get('logger');
    const RedisInstance = Container.get('redisInstance');
    const wss = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    try {
      // @ts-ignore
      wss.on('message', async function incoming(message) {
        console.log('received: %s', message);
        // @ts-ignore
        const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
        // @ts-ignore
        const setAsync = promisify(RedisInstance.set).bind(RedisInstance);

        let object = JSON.parse(message);
        // @ts-ignore
        await setAsync('btc_current_price', object.p);
        await setAsync('btc_timestamp', object.T);
        // @ts-ignore
        let btcHighPrice = await getAsync('btc_high_price');
        if (!btcHighPrice || isNaN(btcHighPrice)) {
          // @ts-ignore
          await setAsync('btc_high_price', object.p);
          await setAsync('btc_high_price', object.T);
        } else {
          if (parseFloat(btcHighPrice) < parseFloat(object.p)) {
            // @ts-ignore
            await setAsync('btc_high_price', object.p);
            await setAsync('btc_high_price_time', object.T);
          }
        }
        // @ts-ignore
        let btcLowPrice = getAsync('btc_low_price');
        if (!btcLowPrice || isNaN(btcLowPrice)) {
          // @ts-ignore
          await setAsync('btc_low_price', object.p);
          await setAsync('btc_low_price_time', object.T);
        } else {
          if (parseFloat(btcLowPrice) > parseFloat(object.p)) {
            // @ts-ignore
            await setAsync('btc_low_price', object.p);
            await setAsync('btc_low_price_time', object.T);
          }
        }

        // @ts-ignore
        console.log('btc_low_price', await getAsync('btc_low_price'));
        // @ts-ignore
        console.log('btc_high_price', await getAsync('btc_high_price'));
        // @ts-ignore
        console.log('btc_current_price', await getAsync('btc_current_price'));
      });

      wss.on('error', function error(error) {
        console.log(error);
      });
    } catch (e) {
      // @ts-ignore
      Logger.error('🔥 Error with Email Sequence Job: %o', e);
    }
  }
}
