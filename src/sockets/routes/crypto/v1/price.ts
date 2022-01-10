import path from 'path';
import middlewares from '../../../middlewares';
import { isStringJson } from '../../../../helpers/object';

export default {
  router: (socket, io) => {

    let watchList = [];
    console.log(socket.id);
    // either with send()
    let interval = setInterval(async function () {
      socket.emit("hello", "world");
      socket.send("Hello!");
    }, 2000);
    socket.on('latest', function (message) {
      if(isStringJson(message)){
        message = JSON.parse(message);
      }
      socket.emit("latest", message);
      console.log(message);
      console.log(message.method);
      if(message.method){
        switch (message.method) {
          case 'subscribe':
            let rooms = socket.rooms;
            rooms.forEach(function (room) {
              socket.leave(room);
            });
            if (message.symbols && Array.isArray(message.symbols)) {
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
            //       socket.to(item).emit('latest', JSON.stringify(priceObject))
            //     })
            //   }, 1000)
            // }
            break;
          default:
            clearInterval(interval);
        }

      }
    });
    socket.on('priceLive', function (message) {
      socket.broadcast.to(message.room).emit('latest', JSON.stringify(message.data));
    })
  },
  middlewares: [middlewares.isAuth]
}

