import { Service, Inject } from 'typedi';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import { dateSecondNow } from '../helpers/date';
import { urlSlug, isBase64, downloadImageAxios, isValidHttpUrl, getBackgroundImage } from '../helpers/crawler';
import fs from 'fs';
import url from 'url';
import path from 'path';
const BUCKET_NAME = 'media-all-bussiness';
@Service()
export default class AwsService {
  constructor(
    @Inject('logger') private logger,
    @Inject('awsS3Instance') private s3Bucket,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async uploadImageToAWS3(fileBuff, fileName = null, s3bucket = null, bucketPath = null): Promise<any> {
    let that = this;
    return new Promise(function(resolve, reject) {
      try {
        if (fileName == null) {
          fileName = dateSecondNow();
        } else {
          fileName = urlSlug(fileName) + '-' + dateSecondNow();
        }
        if (isBase64(fileBuff)) {
          let fileType = fileBuff.substring('data:image/'.length, fileBuff.indexOf(';base64'));
          let imageBody = fileBuff.replace(/^data:image\/\w+;base64,/, '');
          imageBody = imageBody.replace(/ /g, '+');
          var buff = Buffer.from(imageBody, 'base64');
          let pos = fileBuff.indexOf(';');
          if (pos > 0) {
            fileName = fileName + '.' + fileType;
            var params = {
              Bucket: bucketPath ? bucketPath : BUCKET_NAME,
              Key: fileName,
              Body: buff,
              ACL: 'public-read',
              ContentType: fileType,
            };
            if (s3bucket === null) {
              s3bucket = that.s3Bucket;
            }
            s3bucket.upload(params, function(err, data) {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          } else {
            reject({ message: 'this is not file buff image!', show: true, code: 201 });
          }
        } else {
          reject({ message: 'not found buff file!', show: true, code: 201 });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  public async downloadImage(uri, fileName, fileExtension?: string) {
    let that = this;
    return new Promise(async function(resolve, reject) {
      const path = process.env.PWD;
      let topImage = await downloadImageAxios(uri, path + '/resource/' + urlSlug(fileName), fileExtension);
      if (topImage) {
        var buffer = fs.readFileSync(topImage.location, 'base64');
        let uploadedImage = await that
          .uploadImageToAWS3('data:' + topImage.fileType + ';base64,' + buffer, urlSlug(fileName))
          .catch(function(e) {
            console.error(e);
            reject(e);
          });
        // remove file image
        if (fs.existsSync(topImage.location)) {
          fs.unlinkSync(topImage.location);
        }
        let image = uploadedImage ? uploadedImage.Location : null;
        return resolve(image);
      } else {
        resolve(null);
      }
    });
  }

  public async reuploadImage(icon, domain = 'https://flashscore.com') {
    if (icon) {
      if (icon.includes('background-image')) {
        icon = getBackgroundImage(icon);
      }
      let imageUri = isValidHttpUrl(icon) ? icon : new URL(icon, domain).href;
      console.log(imageUri);
      if (isValidHttpUrl(imageUri)) {
        let parsed = url.parse(imageUri);
        let fileName = path.basename(parsed.pathname);
        let fileExtensionArr = fileName.split('.');
        let fileExtension = null;
        if (fileExtensionArr.length > 1) {
          fileExtension = fileExtensionArr[fileExtensionArr.length - 1];
        }
        let image = await this.downloadImage(imageUri, fileName, fileExtension);
        return image;
      }
    }
    return null;
  }
}
