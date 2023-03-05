#!/usr/bin/env node

// eslint-disable-next-line import/extensions
import generate from './index.js';

const argList = process.argv.join('=').split('=');
let outputPath;
let excludeGlobs;

argList.forEach((item, index) => {
  if (item === '--output' || item === '-o') {
    outputPath = argList[index + 1];
  } else if (item === '--exclude-globs') {
    excludeGlobs = argList[index + 1].split(',');
  }
});

generate({
  excludeGlobs,
  outputPath,
}).then(() => {
  console.log(outputPath + ' is ready.');
}, console.error).then(() => {
  process.exit(0);
});
