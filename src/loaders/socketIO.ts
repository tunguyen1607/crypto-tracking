import queryString from "query-string";
import config from "../config";
const jwt = require('jsonwebtoken');
import routes from '../sockets';

export default async (expressServer, opts) => {
  const io =  require( "socket.io" )( expressServer );

  routes(io);
};
