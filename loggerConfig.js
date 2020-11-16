const { MCLogger } = require('@map-colonies/mc-logger');
const service = require('./package.json');
const config = require('config');

const loggerConfig = {
  level: config.log.level
};

const logger = new MCLogger(loggerConfig, service);

module.exports = logger;
