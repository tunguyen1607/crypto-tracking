import config from '../config';
import redis from 'redis';
import { promisify } from 'util';

export default () => {
  // @ts-ignore
  return new Promise(function(resolve, reject) {
    const client = redis.createClient({
      url: config.redis.url,
      // optional, if using SSL
      // use `fs.readFile[Sync]` or another method to bring these values in
      // tls: {
      //   key: stringValueOfKeyFile,
      //   cert: stringValueOfCertFile,
      //   ca: [stringValueOfCaCertFile],
      // },
    });
    client.on('error', function(error) {
      console.error(error);
      reject(error);
    });

    return resolve(client);
  });
};
