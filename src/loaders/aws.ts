import config from '../config';
import aws from 'aws-sdk';
const BUCKET_NAME = config.aws.bucketName;
const IAM_USER_KEY = config.aws.userKey;
const IAM_USER_SECRET = config.aws.userSecret;

export default () => {
  // @ts-ignore
  return new aws.S3({ accessKeyId: IAM_USER_KEY, secretAccessKey: IAM_USER_SECRET, Bucket: BUCKET_NAME });
  /**
   * This voodoo magic is proper from agenda.js so I'm not gonna explain too much here.
   * https://github.com/agenda/agenda#mongomongoclientinstance
   */
};
