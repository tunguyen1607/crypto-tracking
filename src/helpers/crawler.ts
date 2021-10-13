import url from 'url';
import { URL } from 'url';
import path from 'path';
import { match } from 'path-to-regexp';
import fs from 'fs';
import request from 'request';
import axios from 'axios';
import mime from 'mime-types';
import striptags from 'striptags';
import * as _ from 'lodash';

export function strip(html) {
  return striptags(html);
}

export function validURL(string) {
  try {
    new URL(string);
  } catch (_) {
    return false;
  }

  return true;
}

export function setHttp(link) {
  if (link.search('/^\\//')) {
    link = 'http:' + link;
  } else if (link.search(/^http[s]?\:\/\//) == -1) {
    link = 'http://' + link;
  }

  return link;
}

export function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

export function downloadImageAxios(
  url,
  imagePath,
  imageExtension?: string,
): Promise<{ location: string; fileType: string }> {
  return new Promise(function(cb, rj) {
    axios({
      url,
      responseType: 'stream',
    }).then(
      response =>
        new Promise((resolve, reject) => {
          let fileExtension = mime.extension(response.headers['content-type']);
          let fileType = response.headers['content-type'];
          if (imageExtension) {
            fileExtension = imageExtension;
            fileType = 'image/' + fileExtension;
          }
          let filePath = imagePath;
          if (fileExtension) {
            filePath = imagePath + '.' + fileExtension;
          }
          // @ts-ignore
          response.data.pipe(fs.createWriteStream(filePath)).on('finish', () =>
              cb({
                location: filePath,
                fileType: fileType,
              }),
            )
            .on('error', e => rj(e));
        }),
    );
  });
}

export function downloadImage(uri, filename, fileExtension: any): Promise<{ location: string; fileType: string }> {
  return new Promise(function(resolve, reject) {
    if (!validURL(uri)) {
      uri = setHttp(uri);
    }
    request.head(uri, function(err, res, body) {
      if (err) {
        console.error(err);
        resolve(null);
      }
      if (res) {
        if (!filename) {
          let parsed = url.parse(uri);
          filename = path.basename(parsed.pathname);
        }
        let fileExtension = mime.extension(res.headers['content-type']);
        request(uri)
          .pipe(fs.createWriteStream(filename + '.' + fileExtension))
          .on('close', function() {
            resolve({
              location: filename + '.' + fileExtension,
              fileType: res.headers['content-type'],
            });
          });
      } else {
        resolve(null);
      }
    });
  });
}

export function urlSlug(str) {
  if (typeof str === 'string') {
    // Chuyển hết sang chữ thường
    str = str.toLowerCase();

    // xóa dấu
    str = str.replace(/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/g, 'a');
    str = str.replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/g, 'e');
    str = str.replace(/(ì|í|ị|ỉ|ĩ)/g, 'i');
    str = str.replace(/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/g, 'o');
    str = str.replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/g, 'u');
    str = str.replace(/(ỳ|ý|ỵ|ỷ|ỹ)/g, 'y');
    str = str.replace(/(đ)/g, 'd');

    // Xóa ký tự đặc biệt
    str = str.replace(/([^0-9a-z-\s])/g, '-');

    // Xóa khoảng trắng thay bằng ký tự -
    str = str.replace(/(\s+)/g, '-');

    // xóa phần dự - ở đầu
    str = str.replace(/^-+/g, '');
    // xóa phần dư - ở cuối
    str = str.replace(/-+$/g, '');

    str = str.replace(/-+/g, '-');
    return str;
  }
}

export function padZero(nr, n, str = null) {
  return Array(n - String(nr).length + 1).join(str || '0') + nr;
}

export function isBase64(str) {
  if (typeof str !== 'string' || str === '' || str.trim() === '') {
    return false;
  }
  try {
    // return isBase(str, { mime: true });
    str = str.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (err) {
    return false;
  }
}

export function getBackgroundImage(str) {
  const regex = /url\(["']?([^"']*)["']?\)/gm;
  let m;
  let url = '';
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      console.log(`Found match, group ${groupIndex}: ${match}`);
      url = match;
    });
  }
  return url;
};
