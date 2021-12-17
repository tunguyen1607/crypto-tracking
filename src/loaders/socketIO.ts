import queryString from "query-string";
import config from "../config";
const jwt = require('jsonwebtoken');
import routes from '../sockets';
import { createAdapter } from '@socket.io/redis-adapter';

export default async (expressServer, opts) => {
  const io =  require( "socket.io" )( expressServer );
  const pubClient = opts.redis;
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));
  routes(io);
};
