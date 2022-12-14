import url from 'url';
import { URL } from 'url';
import path from 'path';
import { match } from 'path-to-regexp';
import fs from 'fs';
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
    ).catch(function (e) {
      console.log(e);
      return rj(e);
    });
  });
}

const download_image = (url, filename, fileExtension: any): Promise<{ location: string; fileType: string }>  =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject)=> {
        if (!validURL(url)) {
          url = setHttp(url);
        }
        if (!filename) {
          let parsed = url.parse(url);
          filename = path.basename(parsed.pathname);
        }
        let fileExtension = mime.extension(response.headers['content-type']);
        // @ts-ignore
        response.data.pipe(fs.createWriteStream(filename + '.' + fileExtension))
          .on('finish', () => resolve({
            location: filename + '.' + fileExtension,
            fileType: response.headers['content-type'],
          }))
          .on('error', e => reject(e));
      }),
  );

export function downloadImage(uri, filename, fileExtension: any): Promise<{ location: string; fileType: string }> {
  return download_image(uri, filename, fileExtension);
}

export function urlSlug(str) {
  if (typeof str === 'string') {
    // Chuy???n h???t sang ch??? th?????ng
    str = str.toLowerCase();

    // x??a d???u
    str = str.replace(/(??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???)/g, 'a');
    str = str.replace(/(??|??|???|???|???|??|???|???|???|???|???)/g, 'e');
    str = str.replace(/(??|??|???|???|??)/g, 'i');
    str = str.replace(/(??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???)/g, 'o');
    str = str.replace(/(??|??|???|???|??|??|???|???|???|???|???)/g, 'u');
    str = str.replace(/(???|??|???|???|???)/g, 'y');
    str = str.replace(/(??)/g, 'd');

    // X??a k?? t??? ?????c bi???t
    str = str.replace(/([^0-9a-z-\s])/g, '-');

    // X??a kho???ng tr???ng thay b???ng k?? t??? -
    str = str.replace(/(\s+)/g, '-');

    // x??a ph???n d??? - ??? ?????u
    str = str.replace(/^-+/g, '');
    // x??a ph???n d?? - ??? cu???i
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
