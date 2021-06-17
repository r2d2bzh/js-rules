import { promises as fs } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import husky from 'husky';
import yaml from 'js-yaml';

// JSON import is still experimental and "--experimental-json-modules" cannot be implied
const require = createRequire(import.meta.url);
const packagejson = require('./package.json');
const defaultLogPreamble = `${packagejson.name}[${packagejson.version}]:`;
const defaultEditWarning = `DO NOT EDIT THIS FILE AS IT IS GENERATED BY ${packagejson.name}`;

export const toYAML = (x) => yaml.dump(x);
export const toMultiline = (array) => array.reduce((acc, current) => `${acc}${current}\n`, ``);
export const addHeader =
  (prefix = '', postfix = '\n') =>
  (header = '') =>
  (content = '') =>
    `${prefix}${header}${postfix}${content}`;
export const addHashedHeader = addHeader('# ');

const eslintConfiguration = { extends: ['@r2d2bzh'] };
const eslintIgnore = ['node_modules'];

const prettierConfiguration = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: 120,
};
const prettierIgnore = ['__fixtures__', 'helm', '*.json', '*.yml', '*.yaml'];

const configurationFiles = (addWarningHeader) => ({
  '.eslintrc.yaml': {
    configuration: eslintConfiguration,
    formatters: [toYAML, addWarningHeader],
  },
  '.eslintignore': {
    configuration: eslintIgnore,
    formatters: [toMultiline, addWarningHeader],
  },
  '.prettierrc.yaml': {
    configuration: prettierConfiguration,
    formatters: [toYAML, addWarningHeader],
  },
  '.prettierignore': {
    configuration: prettierIgnore,
    formatters: [toMultiline, addWarningHeader],
  },
});

const setConfiguration = (logStep) => (files) =>
  Promise.all(
    Object.entries(files).map(async ([name, { configuration, formatters }]) => {
      const configurationPath = path.join(process.cwd(), name);
      const content = formatters.reduce((content, format) => format(content), configuration);
      await fs.writeFile(configurationPath, content);
      logStep(`${configurationPath} configuration file deployed`);
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

const setHuskyHooks = (logStep) => (hooks) => {
  husky.install();
  Object.entries(hooks).forEach(([name, commands]) => {
    const hook = path.join(process.cwd(), '.husky', name);
    husky.set(hook, '');
    commands.forEach((command) => husky.add(hook, command));
    logStep(`${hook} husky hook deployed`);
  });
};

export const install = async ({
  editWarning = defaultEditWarning,
  logPreamble = defaultLogPreamble,
  tweakConfigurationFiles = (f) => f,
  tweakHuskyHooks = (h) => h,
  stepLogger = console,
  resultLogger = console,
} = {}) => {
  try {
    const logStep = (...args) => stepLogger.log(logPreamble, ...args);
    await setConfiguration(logStep)(await tweakConfigurationFiles(configurationFiles(addHashedHeader(editWarning))));
    setHuskyHooks(logStep)(await tweakHuskyHooks(huskyHooks));
    resultLogger.log(logPreamble, `successfully deployed`);
  } catch (e) {
    resultLogger.error(logPreamble, `installation failed: ${e.message ? e.message : e}`);
    throw e;
  }
};

export default {
  install,
  toMultiline,
  toYAML,
  addHeader,
  addHashedHeader,
};
