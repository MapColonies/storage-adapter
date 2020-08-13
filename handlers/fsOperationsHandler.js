const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const fse = bluebird.promisifyAll(require('fs-extra'));
const Path = require('path');
const uri2path = require('file-uri-to-path');

module.exports = class FileOperationsHandler {
  constructor(logger) {
    this.logger = logger;
  }

  deleteFile(path) {
    if (path.startsWith('file://')) {
      path = uri2path(path);
      if (path.startsWith('\\')) {
        path = path.slice(2);
      }
    }
    return fs
      .unlinkAsync(path)
      .then(() => {
        // file exists
        this.logger.log('debug', `File ${path} deleted`);
        return true;
      })
      .catch((err) => {
        // error delete file from disk
        if (err.code === 'ENOENT') {
          // no such file or directory
          return true;
        }
        this.logger.log(
          'error',
          `Error deleting file ${path} : ${err.message}`
        );
        throw err;
      });
  }

  writeFile(path, content) {
    if (path.startsWith('file://')) {
      path = uri2path(path);
      if (path.startsWith('\\')) {
        path = path.slice(2);
      }
    }
    const self = this;
    // create path directories if not exist
    return this.makeDir(Path.dirname(path)).then(function () {
      // write File Async
      return fs
        .writeFileAsync(path, content)
        .then(function () {
          self.logger.log('info', 'Write file successfully: ' + path);
          return true;
        })
        .catch(function (err) {
          // some error
          self.logger.log('error', 'Write file failed with error: ' + err);
          throw err;
        });
    });
  }

  createWriteStream(path) {
    if (path.startsWith('file://')) {
      path = uri2path(path);
      if (path.startsWith('\\')) {
        path = path.slice(2);
      }
    }
    return this.makeDir(Path.dirname(path)).then(function () {
      return fs.createWriteStream(path);
    });
  }

  readFile(path) {
    if (path.startsWith('file://')) {
      path = uri2path(path);
    }
    const self = this;
    // check that file exists Async
    return fs
      .statAsync(path)
      .then(function (res) {
        // file exists
        return fs
          .readFileAsync(path)
          .then(function (content) {
            // file exists
            return content;
          })
          .catch(function (err) {
            // error read file from disk
            self.logger.log('error', 'File cant be read: ' + err);
            throw err;
          });
      })
      .catch(function (err) {
        // error read file from disk
        self.logger.log('error', 'Read file failed, file not exists: ' + err);
        throw err;
      });
  }

  createReadStream(path) {
    if (path.startsWith('file://')) {
      path = uri2path(path);
      if (path.startsWith('\\')) {
        path = path.slice(2);
      }
    }
    return this.exists(path).then((exists) => {
      if (exists) {
        return fs.createReadStream(path);
      } else {
        const self = this;
        self.logger.log('error', 'createReadStream failed, file not exists');
        throw new Error(`Error: File in path ${path} does not exist.`);
      }
    });
  }

  copyFile(src, dest) {
    if (src.startsWith('file://')) {
      src = uri2path(src);
    }
    if (dest.startsWith('file://')) {
      dest = uri2path(dest);
    }
    return fse.copy(src, dest);
  }

  async makeDir(dirPath) {
    if (dirPath.startsWith('file://')) {
      dirPath = uri2path(dirPath);
    }
    try {
      return await fse.mkdirs(dirPath);
    } catch (err) {
      console.log(err);
    }
  }

  readDir(dirPath) {
    if (dirPath.startsWith('file://')) {
      dirPath = uri2path(dirPath);
      if (dirPath.startsWith('\\')) {
        dirPath = dirPath.slice(2);
      }
    }
    return new Promise((resolve, reject) => {
      return fs.readdir(dirPath, (err, filenames) => {
        return err ? reject(err) : resolve(filenames);
      });
    });
  }

  exists(path) {
    if (path.startsWith('file://')) {
      path = uri2path(path);
      if (path.startsWith('\\')) {
        path = path.slice(2);
      }
    }
    return fse.pathExists(path).then((exists) => {
      return exists;
    });
  }
};
