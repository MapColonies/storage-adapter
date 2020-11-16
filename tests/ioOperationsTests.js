'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;

chai.use(chaiAsPromised);

const ioOperationsHandler = require('../handlers/ioOperationsHandler');

describe('io operations test', function () {
  it('input validation - success', function () {
    return expect(ioOperationsHandler.prototype.validateInput('1', '2', '3')).to.equal(true);
  });

  it('input validation - undefined argument', function () {
    return expect(ioOperationsHandler.prototype.validateInput.bind(ioOperationsHandler, '1', undefined, '3')).to.throw('Error: argument is not defined');
  });
});
