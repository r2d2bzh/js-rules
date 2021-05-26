import { promises as fs } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import husky from 'husky';

// JSON import is still experimental and "--experimental-json-modules" cannot be implied
const require = createRequire(import.meta.url);
const packagejson = require('./package.json');

const toJSON = (x) => JSON.stringify(x, null, 2);
const toMultiline = (array) => array.reduce((acc, current) => `${acc}${current}\n`);

const eslintConfiguration = { extends: ['@r2d2bzh'] };
const eslintIgnore = ['node_modules'];

const preCommit = [
  // tag::pre-commit[]
  'npx --no pretty-quick --staged',
  'npx --no eslint --fix .',
  // end::pre-commit[]
];

const prettierConfiguration = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: 120,
};
const prettierIgnore = ['__fixtures__', 'helm', '*.json', '*.yml', '*.yaml'];

const configurationFiles = {
  eslint: {
    '.eslintrc.json': toJSON(eslintConfiguration),
    '.eslintignore': toMultiline(eslintIgnore),
  },
  prettier: {
    '.prettierrc.json': toJSON(prettierConfiguration),
    '.prettierignore': toMultiline(prettierIgnore),
  },
};

const setConfiguration = (files) =>
  Promise.all(
    Object.entries(files).map(async ([toolName, configFiles]) => {
      await Promise.all(
        Object.entries(configFiles).map(([name, data]) => fs.writeFile(path.join(process.cwd(), name), data))
      );
      console.log(
        `${packagejson.name}[${packagejson.version}]: ${toolName} configuration deployed on ${process.cwd()}`
      );
    })
  );

const setHusky = () => {
  husky.install();
  husky.set('.husky/pre-commit', '');
  preCommit.forEach((command) => husky.add('.husky/pre-commit', command));
};

export const install = async () => {
  try {
    await setConfiguration(configurationFiles);
    setHusky();
    console.log(`${packagejson.name}[${packagejson.version}] successfully deployed`);
  } catch (e) {
    console.error(`${packagejson.name}[${packagejson.version}] installation failed: ${e.message ? e.message : e}`);
    throw e;
  }
};
