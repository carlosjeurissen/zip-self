#!/usr/bin/env node
'use strict';

const fs = require('fs');
const globby = require('globby');
const archiver = require('archiver');

const executionPath = process.argv[1].replace(/\\+/g, '/');
const usedAsCli = executionPath.endsWith('/zip-self') || executionPath.endsWith('/zip-self/index.js');

function getGlobsToInclude (excludeGlobs) {
  const globs = ['**'];
  if (Array.isArray(excludeGlobs)) {
    excludeGlobs.forEach(function (item) {
      globs.push('!' + item);
    });
  }

  return globby(globs, {
    gitignore: true
  });
}

function writeToArchive (outputPath, globs) {
  return new Promise(function (resolve, reject) {
    const outputStream = fs.createWriteStream(outputPath);

    outputStream.on('close', resolve);

    const archive = archiver('zip');
    archive.on('error', reject);
    archive.pipe(outputStream);

    globs.forEach(function (glob) {
      archive.glob(glob);
    });
    archive.finalize();
  });
}

function readJsonFile (filePath) {
  try {
    const fileText = fs.readFileSync(filePath);
    return JSON.parse(fileText);
  } catch (e) {
    console.log('Couldn\'t read json file: ' + e);
  }
}

function getVersion () {
  const version = process.env.npm_package_version;
  if (version) return version;
  const packageJson = readJsonFile('./package.json') || {};
  return packageJson.version || 'unknown';
}

function generate (params) {
  const version = getVersion();
  const outputPath = params.outputPath.replace('{version}', version);
  const excludeGlobs = params.excludeGlobs;

  return getGlobsToInclude(excludeGlobs).then(function (globs) {
    return writeToArchive(outputPath, globs);
  }).then(function () {
    console.log(outputPath + ' is ready.');
  }, console.error);
}

if (usedAsCli) {
  const argList = process.argv.join('=').split('=');
  let outputPath = null;
  let excludeGlobs = null;
  argList.forEach((item, index) => {
    if (item === '--output' || item === '-o') {
      outputPath = argList[index + 1];
    } else if (item === '--exclude-globs') {
      excludeGlobs = argList[index + 1].split(',');
    }
  });

  generate({
    outputPath: outputPath,
    excludeGlobs: excludeGlobs
  });
}

exports.generate = generate;
module.exports = exports.generate;
