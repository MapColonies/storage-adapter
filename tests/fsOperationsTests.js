'use strict';

const container = require('../containerConfig');
const logger = container.get('logger');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const expect = chai.expect;

chai.use(chaiAsPromised);

const FsOperationsHandler = require('../handlers/fsOperationsHandler');
const fsHandler = new FsOperationsHandler(logger);
const loggerStub = {};

describe('filesystem operations test', function () {
  beforeEach(() => {
    loggerStub.log = sinon.stub(logger, 'log');
  });

  afterEach(() => {
    loggerStub.log.restore();
  });

  it('create folders of non existing path when trying to write', function () {
    return expect(fsHandler.writeFile('file://D-P-ZIVDA/myShared/csms/testfile.json', 'Some test content for file')).to.eventually.be.fulfilled;
  });

  it('file exists', function (done) {
    return fsHandler.exists('file://D-P-ZIVDA/myShared/csms/testfile.json').then(exists => {
      expect(exists).to.equal(true);
      done();
    });
  });

  it('file not exists', function (done) {
    return fsHandler.exists('file://D-P-ZIVDA/myShared/csms/testfile0.json').then(exists => {
      expect(exists).to.equal(false);
      done();
    });
  });

  it('read from directories', function (done) {
    return fsHandler.readDir('file://D-P-ZIVDA/myShared/csms').then(result => {
      expect(result.length).to.equal(1);
      done();
    });
  });
});
