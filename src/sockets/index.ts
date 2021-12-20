import { listJSFilesSync } from '../helpers/file';
import path from 'path';

export default async (io) => {
  let files = await listJSFilesSync(path.dirname(__dirname) + '/sockets/routes');
  for (let i = 0; i < files.length; i++) {
    console.log(files[i].file);
    let router = io.of('/' + files[i].version + '/' + files[i].module + '/'+ files[i].fileName);
    let middlewares:any = require(files[i].file).default.middlewares;
    if(middlewares instanceof Array){
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
};
