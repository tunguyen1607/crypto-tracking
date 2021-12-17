import { listJSFilesSync } from '../helpers/file';
import path from 'path';

export default (io) => {
  listJSFilesSync(path.dirname(__dirname) + '/sockets/routes').then(function(files) {
    for (let i = 0; i < files.length; i++) {
      console.log(files[i].file);
      io.use(require(files[i].file).default.middlewares);
      io.of('/' + files[i].version + '/' + files[i].module + '/'+ files[i].fileName)
        .on('connection', function (socket) {
          require(files[i].file).default.router(socket, io);
        });
    }
  });
};
