import queryString from "query-string";
import config from "../config";
const jwt = require('jsonwebtoken');

export default async (expressServer, opts) => {
  const io =  require( "socket.io" )( expressServer );
  io.use(function(socket, next){
    if (socket.handshake.query && socket.handshake.query.token){
      jwt.verify(socket.handshake.query.token, config.jwtSecret, (err, decoded) => {
        if (err){
          return next(new Error('Authentication error'));
        }
        socket.decoded = decoded;
        next();
      });
    }
    else {
      next(new Error('Authentication error'));
    }
  })
    .on('connection', function(socket) {
      // Connection now authenticated to receive further events

      socket.on('message', function(message) {
        console.log(socket.decoded);
        console.log(message);
        socket.emit('message', JSON.stringify({message: 'receive mess', data: message}));
      });
      setInterval(function () {
        socket.emit('crypto', JSON.stringify({message: 'receive mess', data: {price: 20204}}));
      }, 1000)
    });
};
