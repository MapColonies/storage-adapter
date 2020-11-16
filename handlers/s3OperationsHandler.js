const bluebird = require('bluebird');
const { trimStart, forEach } = require('lodash');
const AWS = require('aws-sdk');
const https = require('https');

module.exports = class S3OperationsHandler {
  constructor(logger, s3config) {
    this.logger = logger;
    this.defaultBucket = s3config.bucket;
    this.useHTTPS = (s3config.sslEnabled === 'true');
    this.s3Client = new AWS.S3({
      endpoint: s3config.endpoint,
      accessKeyId: s3config.accessKeyId,
      secretAccessKey: s3config.secretAccessKey,
      region: '',
      sslEnabled: this.useHTTPS,
      s3ForcePathStyle: true,
      s3BucketEndpoint: false,
      apiVersion: '2006-03-01'
    });

    if (this.useHTTPS) {
      this.s3Client.config.update({
        httpOptions: { agent: new https.Agent({ rejectUnauthorized: false }) }
      });
    }

    this.downloader = require('s3-download')(this.s3Client);
    this.uploader = require('s3-upload-stream')(this.s3Client);
  }

  deleteObject(path) {
    const params = {
      Bucket: this.extractBucket(path),
      Key: this.extractKey(path)
    };

    return this.s3Client.deleteObject(params).promise().then(() => {
      this.logger.log('debug', 'deleteObject finished successfully');
    }).catch(err => {
      this.logger.log('error', 'deleteObject ended with error: %s', err, {});
    });
  }

  putObject(path, content = null) {
    const params = {
      Bucket: this.extractBucket(path),
      Key: this.extractKey(path),
      Body: content
    };

    console.log(params);
    return this.s3Client.putObject(params).promise().then(() => {
      this.logger.log('debug', 'putObject finished successfully');
    }).catch(err => {
      this.logger.log('error', 'putObject ended with error: %s', err, {});
    });
  }

  getObject(path) {
    const params = {
      Bucket: this.extractBucket(path),
      Key: this.extractKey(path)
    };

    return this.s3Client.getObject(params).promise().then(data => {
      const objectData = data.Body.toString();
      this.logger.log('debug', 'getObject finished successfully');
      return objectData;
    }).catch(err => {
      this.logger.log('error', 'getObject ended with error: %s', err, {});
    });
  }

  uploadFromStream(dest, stream, metadata = null) {
    const params = {
      Bucket: this.extractBucket(dest),
      Key: this.extractKey(dest),
      Metadata: this.createStringMap(metadata)
    };

    const that = this;
    return new bluebird.Promise(function (resolve, reject) {
      const uploader = that.uploader.upload(params);
      uploader.on('error', function (error) {
        that.logger.log('debug', 'multipart upload error: ', error);
        stream.close();
        reject(error);
      });
      uploader.on('part', function (details) {
        that.logger.log('debug', 'multipart upload part details: ', details);
      });
      uploader.on('uploaded', function (details) {
        that.logger.log('debug', 'finished multipart upload: ', details);
        resolve();
      });
      stream.pipe(uploader);
    });
  }

  downloadToStream(src, stream) {
    const params = {
      Bucket: this.extractBucket(src),
      Key: this.extractKey(src)
    };

    const that = this;
    return this.s3Client.headObject(params).promise().then(data => {
      return new bluebird.Promise(function (resolve, reject) {
        const downloader = that.downloader.download(params, {
          totalObjectSize: data.ContentLength
        });
        downloader.on('error', function (error) {
          that.logger.log('debug', 'multipart download error: ', error);
          stream.close();
          reject(error);
        });
        downloader.on('part', function (details) {
          that.logger.log('debug', 'multipart download part details: ', details);
        });
        downloader.on('downloaded', function (details) {
          that.logger.log('debug', 'finished multipart download: ', details);
          resolve();
        });
        downloader.pipe(stream);
      });
    }).catch(err => {
      console.log('headObject ended with error: %s', err);
    });
  }

  copyObject(src, dest) {
    const params = {
      Bucket: this.extractBucket(dest),
      CopySource: `/${this.extractBucket(dest)}/${this.extractKey(src)}`,
      Key: this.extractKey(dest)
    };

    return this.s3Client.copyObject(params).promise().then(data => {
      this.logger.log('debug', 'copyObject finished successfully');
    }).catch(err => {
      this.logger.log('error', 'copyObject ended with error: %s', err, {});
    });
  }

  extractKey(path) {
    const key = path.replace(/\\/g, '/');
    const prefixToRemove = 's3://' + this.extractBucket(path) + '/';
    if (key.startsWith(prefixToRemove)) {
      return key.replace(prefixToRemove, '');
    }
    return trimStart(key, '/');
  }

  extractBucket(path) {
    let bucket = this.defaultBucket;
    if (path.startsWith('s3://')) {
      bucket = path.replace('s3://', '').split('/')[0];
    }
    return bucket;
  }

  createStringMap(obj = null) {
    if (obj === null) return null;
    const strObj = {};
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'object') {
        strObj[k] = JSON.stringify(obj[k]);
      } else {
        strObj[k] = String(obj[k]);
      }
    }
    return strObj;
  }

  exists(path) {
    const params = {
      Bucket: this.extractBucket(path),
      Key: this.extractKey(path)
    };

    return this.s3Client.headObject(params).promise().then(data => {
      return true;
    }).catch(err => {
      this.logger.log('warn', err);
      return false;
    });
  }

  readDir(path) {
    const params = {
      Bucket: this.extractBucket(path),
      Prefix: this.extractKey(path)
    };

    return this.s3Client.listObjectsV2(params).promise().then(data => {
      const res = [];
      forEach(data.Contents, obj => {
        res.push(obj.Key.replace(params.Prefix, '').split('/')[0]);
      });
      this.logger.log('debug', 'listObjectsV2 finished successfully');
      return res;
    }).catch(err => {
      this.logger.log('error', 'listObjectsV2 ended with error: %s', err, {});
    });
  }
};
