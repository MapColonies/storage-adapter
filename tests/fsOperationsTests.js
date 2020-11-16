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

  it('file exists', async function () {
    const filePath = path.resolve(__dirname, 'data', 'testfile.json');
    const exists = await fsHandler.exists(`file://${filePath}`);
    expect(exists).to.equal(true);
  });

  it('file not exists', async function () {
    const filePath = path.resolve(__dirname, 'data', 'testfile0.json');
    const exists = await fsHandler.exists(`file://${filePath}`);
    expect(exists).to.equal(false);
  });

  it('read from directories', async function () {
    const filePath = path.resolve(__dirname, 'data');
    const result = await fsHandler.readDir(`file://${filePath}`);
    expect(result.length).to.equal(1);
  });
});
