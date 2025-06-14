import { promises as fs } from 'node:fs';
import { globby } from 'globby';
import archiver from 'archiver';

async function getVersion () {
  // 1. Check the environment variable first. This is the highest priority.
  const npmVersion = process.env.npm_package_version;
  if (npmVersion) {
    return npmVersion;
  }

  // 2. If not found, fall back to reading package.json.
  const packageJsonPath = './package.json';
  try {
    const fileContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(fileContent);

    // Explicitly check if the version key exists in the parsed JSON
    if (packageJson.version) {
      return packageJson.version;
    }

    // If the key is missing, issue a specific warning and return 'unknown'
    console.warn('Warning: Found and read \'package.json\', but the \'version\' field is missing.');
    return 'unknown';
  } catch (error) {
    // This catch block handles errors like file not found or invalid JSON
    console.warn(`'npm_package_version' env var not set. Fallback to package.json failed: ${error.message}`);
    return 'unknown';
  }
}

async function createArchive (outputPath, excludeGlobs = []) {
  const globs = ['**', ...excludeGlobs.map((glob) => `!${glob}`)];
  const filesToInclude = await globby(globs, { gitignore: true });

  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(outputPath);
    const archive = archiver('zip');

    outputStream.on('close', resolve);
    archive.on('warning', (err) => console.warn(err));
    archive.on('error', (err) => reject(err));

    archive.pipe(outputStream);

    filesToInclude.forEach((file) => {
      archive.file(file, { name: file });
    });

    archive.finalize();
  });
}

export default async function generate (params) {
  try {
    const version = await getVersion();
    const outputPath = params.outputPath.replace('{version}', version);

    await createArchive(outputPath, params.excludeGlobs);
    console.log(`Successfully created archive at: ${outputPath}`);
  } catch (error) {
    console.error(`Failed to generate archive: ${error}`);
  }
}
