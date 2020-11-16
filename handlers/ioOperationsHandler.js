const fileUriToPath = require('file-uri-to-path');
const fs = require('fs');
const { forEach, isEmpty } = require('lodash');
const S3OperationsHandler = require('./s3OperationsHandler');
const FileOperationsHandler = require('./fsOperationsHandler');
module.exports = class IOOperationsHandler {
  constructor(logger, s3config) {
    this.logger = logger;
    this.s3config = s3config;
    this.fsHandler = new FileOperationsHandler(logger);
    this.osHandler = new S3OperationsHandler(logger, s3config);

    if (isEmpty(this.osHandler)) { this.logger.log('warn', 'io package has been initialized without s3 support due to missing configuration') }
  }

  validateInput(...args) {
    forEach(args, arg => {
      if (!arg) {
        throw new Error('Error: argument is not defined');
      }
    });
    return true;
  }

  delete(resourceLocation) {
    this.validateInput(resourceLocation);

    if (resourceLocation.startsWith('s3://')) {
      return this.osHandler.deleteObject(resourceLocation);
    } else if (resourceLocation.startsWith('file://')) {
      return this.fsHandler.deleteFile(resourceLocation);
    } else {
      throw new Error('Error: Path received is not a valid URI. Should start with \'file://\' or with \'s3://\'');
    }
  }

  write(resourceLocation, content) {
    this.validateInput(resourceLocation, content);

    if (resourceLocation.startsWith('s3://')) {
      return this.osHandler.putObject(resourceLocation, content);
    } else if (resourceLocation.startsWith('file://')) {
      return this.fsHandler.writeFile(resourceLocation, content);
    } else {
      throw new Error('Error: Path received is not a valid URI. Should start with \'file://\' or with \'s3://\'');
    }
  }

  read(resourceLocation) {
    this.validateInput(resourceLocation);

    if (resourceLocation.startsWith('s3://')) {
      return this.osHandler.getObject(resourceLocation);
    } else if (resourceLocation.startsWith('file://')) {
      return this.fsHandler.readFile(resourceLocation);
    } else {
      throw new Error('Error: Path received is not a valid URI. Should start with \'file://\' or with \'s3://\'');
    }
  }

  copy(src, dest, metadata = null) {
    this.validateInput(src, dest);

    if (!src.startsWith('s3://') && !src.startsWith('file://')) {
      throw new Error('Error: Source path received is not a valid URI. Should start with \'file://\' or with \'s3://\'');
    }
    if (!dest.startsWith('s3://') && !dest.startsWith('file://')) {
      throw new Error('Error: Destination path received is not a valid URI. Should start with \'file://\' or with \'s3://\'');
    }

    const isSrcS3 = src.startsWith('s3://');
    const isDestS3 = dest.startsWith('s3://');

    if (!isSrcS3 && !isDestS3) { // fs to fs
      return this.fsHandler.copyFile(src, dest);
    } else if (isSrcS3 && isDestS3) { // os to os
      return this.osHandler.copyObject(src, dest);
    } else if (isSrcS3 && !isDestS3) { // os to fs
      return this.fsHandler.createWriteStream(dest).then(writer => {
        return this.osHandler.downloadToStream(src, writer);
      });
    } else { // fs to os
      this.logOnEmptyFileAs(src); // just log - don't waste time on it.
      return this.fsHandler.createReadStream(src).then(reader => {
        return this.osHandler.uploadFromStream(dest, reader, metadata);
      });
    }
  }

  makeDir(dirPath) {
    this.validateInput(dirPath);

    if (dirPath.startsWith('file://')) {
      return this.fsHandler.makeDir(dirPath);
    } else if (dirPath.startsWith('s3://')) {
      if (!dirPath.endsWith('/')) {
        dirPath = dirPath + '/';
      }
      return this.osHandler.putObject(dirPath);
    } else {
      throw new Error('Error: To create a directory, path must be a valid filesystem URI.');
    }
  }

  readDir(dirPath) {
    this.validateInput(dirPath);

    if (dirPath.startsWith('file://')) {
      return this.fsHandler.readDir(dirPath);
    } else if (dirPath.startsWith('s3://')) {
      if (!dirPath.endsWith('/')) {
        dirPath = dirPath + '/';
      }
      return this.osHandler.readDir(dirPath);
    } else {
      throw new Error('Error: To read a directory, path must be a valid filesystem URI.');
    }
  }

  exists(resourceLocation) {
    this.validateInput(resourceLocation);

    if (resourceLocation.startsWith('s3://')) {
      return this.osHandler.exists(resourceLocation);
    } else if (resourceLocation.startsWith('file://')) {
      return this.fsHandler.exists(resourceLocation);
    } else {
      throw new Error('Error: Path received is not a valid URI. Should start with \'file://\' or with \'s3://\'');
    }
  }

  logOnEmptyFileAs(uri) {
    try {
      const fn = fileUriToPath(uri);
      fs.stat(fn, (err, stats) => {
        if (!err) {
          const fileSize = stats.size;
          if (fileSize === 0) {
            this.logger.log('error', `File (${uri}) has length of 0, it will not be copied to object storage.`);
          }
        }
      });
    } catch (err) {
      this.logger.log('error', `Couldn't check if file is empty: ${uri}`);
    }
    return false;
  }
};
