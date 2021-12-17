import config from '../../config';
const jwt = require('jsonwebtoken');
/**
 * We are assuming that the JWT will come in a header with the form
 *
 * Authorization: Bearer ${JWT}
 *
 * But it could come in a query parameter with the name that you want like
 * GET https://my-bulletproof-api.com/stats?apiKey=${JWT}
 * Luckily this API follow _common sense_ ergo a _good design_ and don't allow that ugly stuff
 */
const isAuth = (socket, args, next) => {
  jwt.verify(socket.handshake.query.token, config.jwtSecret, (err, decoded) => {
    if (err){
      return next(new Error('Authentication error'));
    }
    socket.decoded = decoded;
    next();
  });
};


export default isAuth;
