'use strict';

const container = require('../containerConfig');
const logger = container.get('logger');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const path = require('path');
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
    const filePath = path.resolve(__dirname, 'data', 'testfile.json');
    return expect(fsHandler.writeFile(`file://${filePath}`, 'Some test content for file')).to.eventually.be.fulfilled;
  });

  it('file exists', function (done) {
    const filePath = path.resolve(__dirname, 'data', 'testfile.json');
    fsHandler.exists(`file://${filePath}`).then(exists => {
      expect(exists).to.equal(true);
      done();
    });
  });

  it('file not exists', function (done) {
    const filePath = path.resolve(__dirname, 'data', 'testfile0.json');
    fsHandler.exists(`file://${filePath}`).then(exists => {
      expect(exists).to.equal(false);
      done();
    });
  });

  it('read from directories', function (done) {
    const filePath = path.resolve(__dirname, 'data');
    fsHandler.readDir(`file://${filePath}`).then(result => {
      expect(result.length).to.equal(1);
      done();
    }).catch(err => console.log(err));
  });
});
