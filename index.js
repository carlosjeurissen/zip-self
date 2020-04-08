const fs = require('fs');
const globby = require('globby');
const archiver = require('archiver');

function generate (params) {
  const version = process.env.npm_package_version;
  const outputPath = params.outputPath.replace('{version}', version);

  globby('**', {
    gitignore: true
  }).then(function (globs) {
    const outputStream = fs.createWriteStream(outputPath);

    outputStream.on('close', function () {
      console.log(outputPath + ' is ready.');
    });

    const archive = archiver('zip');
    archive.on('error', console.error);
    archive.pipe(outputStream);

    globs.forEach(function (glob) {
      archive.glob(glob);
    });
    archive.finalize();
  });
}

const argList = process.argv.join('=').split('=');
if (argList.length > 2) {
  let outputPath = null;
  argList.forEach((item, index) => {
    if (item === '--output' || item === '-o') {
      outputPath = argList[index + 1];
    }
  });

  generate({
    outputPath: outputPath
  });
}

exports.generate = generate;
module.exports = exports.generate;
