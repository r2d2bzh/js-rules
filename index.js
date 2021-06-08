import { promises as fs } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import husky from 'husky';

// JSON import is still experimental and "--experimental-json-modules" cannot be implied
const require = createRequire(import.meta.url);
const packagejson = require('./package.json');
const logPreamble = `${packagejson.name}[${packagejson.version}]:`;

const toJSON = (x) => JSON.stringify(x, null, 2);
const toMultiline = (array) => array.reduce((acc, current) => `${acc}${current}\n`, '');

const eslintConfiguration = { extends: ['@r2d2bzh'] };
const eslintIgnore = ['node_modules'];

const prettierConfiguration = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: 120,
};
const prettierIgnore = ['__fixtures__', 'helm', '*.json', '*.yml', '*.yaml'];

const configurationFiles = {
  '.eslintrc.json': {
    configuration: eslintConfiguration,
    formatters: [toJSON],
  },
  '.eslintignore': {
    configuration: eslintIgnore,
    formatters: [toMultiline],
  },
  '.prettierrc.json': {
    configuration: prettierConfiguration,
    formatters: [toJSON],
  },
  '.prettierignore': {
    configuration: prettierIgnore,
    formatters: [toMultiline],
  },
};

const setConfiguration = (files) =>
  Promise.all(
    Object.entries(files).map(async ([name, { configuration, formatters }]) => {
      const configurationPath = path.join(process.cwd(), name);
      const content = formatters.reduce((content, format) => format(content), configuration);
      await fs.writeFile(configurationPath, content);
      console.log(logPreamble, `${configurationPath} configuration file deployed`);
    })
  );

const huskyHooks = {
  'pre-commit': [
    // tag::pre-commit[]
    'npx --no-install pretty-quick --staged',
    'npx --no-install eslint --fix .',
    // end::pre-commit[]
  ],
};

const setHuskyHooks = (hooks) => {
  husky.install();
  Object.entries(hooks).forEach(([name, commands]) => {
    const hook = path.join(process.cwd(), '.husky', name);
    husky.set(hook, '');
    commands.forEach((command) => husky.add(hook, command));
    console.log(logPreamble, `${hook} husky hook deployed`);
  });
};

export const install = async (tweakConfigurationFiles = (f) => f, tweakHuskyHooks = (h) => h) => {
  try {
    await setConfiguration(tweakConfigurationFiles(configurationFiles));
    setHuskyHooks(tweakHuskyHooks(huskyHooks));
    console.log(logPreamble, `successfully deployed`);
  } catch (e) {
    console.error(logPreamble, `installation failed: ${e.message ? e.message : e}`);
    throw e;
  }
};
