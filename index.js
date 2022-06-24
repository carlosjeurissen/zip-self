import fs from 'node:fs';
import globby from 'globby';
import archiver from 'archiver';

function getGlobsToInclude (excludeGlobs) {
  const globs = ['**'];
  if (Array.isArray(excludeGlobs)) {
    excludeGlobs.forEach((item) => {
      globs.push('!' + item);
    });
  }

  return globby(globs, {
    gitignore: true,
  });
}

function writeToArchive (outputPath, globs) {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(outputPath);

    outputStream.on('close', resolve);

    const archive = archiver('zip');
    archive.on('error', reject);
    archive.pipe(outputStream);

    globs.forEach((glob) => {
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
    return {};
  }
}

function getVersion () {
  const version = process.env.npm_package_version;
  if (version) return version;
  const packageJson = readJsonFile('./package.json');
  return packageJson.version || 'unknown';
}

export default function generate (params) {
  const version = getVersion();
  const outputPath = params.outputPath.replace('{version}', version);
  const excludeGlobs = params.excludeGlobs;

  return getGlobsToInclude(excludeGlobs)
    .then((globs) => writeToArchive(outputPath, globs));
}
