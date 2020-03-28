import path from 'path';
import glob from 'glob';
import fs from 'fs';
import callsite from 'callsite';

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
    console.log(jsFiles);
    callback(null, jsFiles);
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
};

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
