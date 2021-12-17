import config from '../config';
import redis from 'redis';
import { promisify } from 'util';

export default () => {
  // @ts-ignore
  return new Promise(function(resolve, reject) {
    console.log(config.redis.url);
    const client = redis.createClient({
      url: config.redis.url,
    });
    client.on('error', function(error) {
      console.error(error);
      reject(error);
    });

    return resolve(client);
  });
};
