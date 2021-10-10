import config from '../config';
import redis from 'redis';

export default () => {
  // @ts-ignore
  return new Promise(function(resolve, reject) {
    const client = redis.createClient({
      port: config.redis.port, // replace with your port
      host: config.redis.host, // replace with your hostanme or IP address
      password: config.redis.password, // replace with your password
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
