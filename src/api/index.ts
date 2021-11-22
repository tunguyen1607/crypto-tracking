import { Router } from 'express';
import auth from './routes/auth';
import user from './routes/user';
import agendash from './routes/agendash';
import { listJSFilesSync } from '../helpers/file';
import path from 'path';
import config from "../config";
const route = Router();
// guaranteed to get dependencies
export default () => {
  const app = Router();
  auth(app);
  user(app);
  agendash(app);
  listJSFilesSync(path.dirname(__dirname) + '/api/routes').then(function(files) {
    for (let i = 0; i < files.length; i++) {
      app.use('/' + files[i].version + '/' + files[i].module + '/', route);
      require(files[i].file).default(route);
    }
  });
  return app;
};
