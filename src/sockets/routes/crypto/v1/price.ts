import path from 'path';
import middlewares from '../../../middlewares';
import {Container} from "typedi";
import {promisify} from "util";

export default {
  router: (socket) => {
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
    let watchList = [];
    let interval = null;
    socket.on('latest', function (message) {
      console.log(message);
      if (message.symbols) {
        watchList = [...message.symbols];
      }
      if (interval) {
        clearInterval(interval);
      }
      if (watchList.length > 0) {
        interval = setInterval(function () {
          watchList.forEach(async function (item) {
            let priceObject = await getAsync(item + '_to_usdt');
            if (priceObject) {
              priceObject = JSON.parse(priceObject);
              priceObject['symbol'] = item;
            }
            socket.emit('latest', JSON.stringify(priceObject))
          })
        }, 1000)
      }
    })
  },
  middlewares: [middlewares.isAuth]
}

