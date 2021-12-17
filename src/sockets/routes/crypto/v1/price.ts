import path from 'path';
import middlewares from '../../../middlewares';
import {Container} from "typedi";
import {promisify} from "util";

export default {
  router: (socket, io) => {
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const setAsync = promisify(RedisInstance.set).bind(RedisInstance);
    let watchList = [];
    let interval = null;
    socket.on('latest', function (message) {
      console.log(message);
      if(message.method){
        console.log(message.method);
        switch (message.method) {
          case 'subscribe':
            let rooms = socket.rooms;
            rooms.forEach(function (room) {
              socket.leave(room);
            });
            if (message.symbols) {
              watchList = [...message.symbols];
              watchList.forEach(function (item) {
                socket.join(item);
              })
            }
            // if (interval) {
            //   clearInterval(interval);
            // }
            // if (watchList.length > 0) {
            //   interval = setInterval(function () {
            //     watchList.forEach(async function (item) {
            //       let priceObject = await getAsync(item + '_to_usdt');
            //       if (priceObject) {
            //         priceObject = JSON.parse(priceObject);
            //         priceObject['symbol'] = item;
            //       }
            //       // socket.to(item).emit('latest', JSON.stringify(priceObject))
            //     })
            //   }, 1000)
            // }
            break;
          case 'system':
            socket.broadcast.to(message.room).emit('latest', message.data);
            break;
          default:
            clearInterval(interval);
        }

      }

    });
  },
  middlewares: [middlewares.isAuth]
}

