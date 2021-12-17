import path from 'path';
import glob from 'glob';
import fs from 'fs';
import callsite from 'callsite';
import aws from '../loaders/aws';

/*
    List all js file

    @param {String} dir
    @param fn
*/
export default function listJSFiles(dir, callback) {
  glob(dir + '/**/*', function(er, files) {
    let jsFiles = [];

    for (let i = 0; i < files.length; i++) {
      let file = files[i];

      //is file ?
      if (!fs.statSync(file).isFile()) continue;

      //is js file ?
      if (path.extname(file) === '.js' || path.extname(file) === '.ts') jsFiles.push(file);
    }
    callback(null, jsFiles);
  });
}

export function runSyncListJsFile(dir) {
  return new Promise(function (resolve, reject) {
    glob(dir + '/**/*', function(er, files) {
      let jsFiles = [];

      for (let i = 0; i < files.length; i++) {
        let file = files[i];

        //is file ?
        if (!fs.statSync(file).isFile()) continue;

        //is js file ?
        if (path.extname(file) === '.js' || path.extname(file) === '.ts') jsFiles.push(file);
      }
      resolve(jsFiles);
    });
  })
}

export function listJSFilesSync(dir): any {
  return new Promise(async function(resolve, reject) {
    let jsFiles = [];
    let modules = await globAsync(dir + '/*');
    for (let m = 0; m < modules.length; m++) {
      if (fs.statSync(modules[m]).isFile()) continue;
      let module = path.parse(modules[m]).base;
      let versions = await globAsync(modules[m] + '/*');
      for (let z = 0; z < versions.length; z++) {
        let pathModule = versions[z];
        let version = path.parse(versions[z]).base;
        if (fs.statSync(pathModule).isFile()) continue;
        let files = await globAsync(pathModule + '/router.*');
        if(!files || files.length == 0){
          files = await globAsync(pathModule + '/*');
        }
        for (let i = 0; i < files.length; i++) {
          let file = files[i];
          let fileName = path.parse(file).name;
          //is file ?
          if (!fs.statSync(file).isFile()) continue;

          //is js file ?
          if (path.extname(file) === '.js' || path.extname(file) === '.ts') jsFiles.push({ file, version, module, fileName });
        }
      }
    }
    return resolve(jsFiles);
  });
}

async function globAsync(dirPath): Promise<any> {
  return new Promise(function(resolve, reject) {
    glob(dirPath, async function(er, versions) {
      if (er) {
        reject(er);
      }
      resolve(versions);
    });
  });
}
/*
    Get the caller path dir then append file name

    @param {String} file_name

    @return {String} caller path join file name
*/
export function remoteDirname(fileName) {
  fileName = fileName || '';

  var stack = callsite();

  //debug
  // console.log(stack[1].getFileName());
  // for (var i = 0; i < stack.length; i++) {
  //     console.log(i);
  //     console.log(stack[i].getFileName());
  //     console.log(path.dirname(stack[i].getFileName()));
  //     console.log('-------------------');
  // }
  /*
      0 -> helper (this file)
      1 -> express-orm-mvc
      2 -> root file
  */
  var requester = stack[2].getFileName();
  return path.join(path.dirname(requester), fileName);
}

export function dateSecondNow(seconds = false) {
  if (seconds) {
    return Math.floor(Date.now());
  } else {
    return Math.floor(Date.now() / 1000);
  }
}

export function addMinutes(date, minutes) {
  return date + minutes * 60;
}
