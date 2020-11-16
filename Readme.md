# Map-Colonies io

> The package wraps basic IO operations for filesystem and object storage by providing a unified API.

## Install

```
$ npm install --save @map-colonies/storeAdapter
```

## Usage

Use the following code example to initialize storeAdapter object:

```js
const { StoreAdapter } = require("@map-colonies/storeAdapter");

// *Specify s3 credentials*
const s3config = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  sslEnabled: 'false', // http/https
  region: 'us-west-2',
  bucket: 'mybucket'
};

// *Specify logger*
const logger = new Logger();

const storeAdapter = new StoreAdapter(logger, s3config);
```

Then call the [relevant method](##Methods) to call with file uri with one of the following protocols: 
- s3
- file

in the following template:
```
<protocol>://<filepath>
```

## Methods

---

Async

- write
- read
- delete
- copy
- makeDir
- readDir
- exists

## Exmaples
---
```js
const { StoreAdapter } = require("@map-colonies/storeAdapter");
const storeAdapter = new StoreAdapter(logger, s3config);

// Async with promises:
storeAdapter.write("file://D:/Path/To/File", "file content")
  .then(() => console.log("success!"))
  .catch((err) => console.error(err));

// Async with callbacks:
storeAdapter.write("file://D:/Path/To/File", "file content", (err) => {
  if (err) return console.error(err);
  console.log("success!");
});

// Async/Await:
async function writeFile() {
  try {
    await storeAdapter.write("file://D:/Path/To/File", "file content");
    console.log("success!");
  } catch (err) {
    console.error(err);
  }
}

writeFile();

// Async/Await S3 protocol (object storage)
async function writeFileToOs() {
  try {
    await storeAdapter.write('s3://mybucket/filename', 'file content');
    console.log('success!');
  } catch (err) {
    console.error(err);
  }
}

writeFileToOs();
```

