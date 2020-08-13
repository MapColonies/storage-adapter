const IOOperationsHandler = require('./handlers/ioOperationsHandler');

module.exports.StoreAdapter = class StoreAdapter extends IOOperationsHandler{
  constructor(logger, s3config) {
    if (!s3config) {
      throw new Error('s3Config is required.');
    }
    if (!logger){
      throw new Error('logger is required.');
    }
    super(logger, s3config);
  }
};
