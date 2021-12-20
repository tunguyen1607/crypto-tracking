import { listJSFilesSync } from '../helpers/file';
import path from 'path';

export default (io) => {
  listJSFilesSync(path.dirname(__dirname) + '/sockets/routes').then(function(files) {
    for (let i = 0; i < files.length; i++) {
      console.log(files[i].file);
      let router = io.of('/' + files[i].version + '/' + files[i].module + '/'+ files[i].fileName);
      let middlewares = require(files[i].file).default.middlewares;
      if(Array.isArray(middlewares)){
        middlewares.forEach(function (middleware) {
          router.use(middleware);
        })
      }else {
        router.use(middlewares);
      }
      router.on('connection', function (socket) {
          require(files[i].file).default.router(socket, io);
        });
    }
  });
};
