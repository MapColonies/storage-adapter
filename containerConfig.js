const container = require('kontainer-di');
const logger = require('./loggerConfig');

container.register('logger', [], logger);

module.exports = container;