import { promises as fs } from 'fs';
import path from 'path';
import husky from 'husky';
import yaml from 'js-yaml';
import { findUp } from 'find-up';

export const readJSONFile = async (path) => {
  try {
    // The purpose of this library is to scaffold based on existing project content
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const json = await fs.readFile(path, { encoding: 'utf8' });
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`failed to extract JSON from ${path} (${e.message})`);
  }
};

export const extractPackageDetails = async ({ url, extract = (x) => x, logger }) => {
  try {
    const packageJSONPath = await findUp('package.json', { cwd: path.dirname(new URL(url).pathname) });
    return extract(await readJSONFile(packageJSONPath));
  } catch (e) {
    logger.error(`Unable to get ${url} package details:`, e.message);
    throw e;
  }
};

const jsRulesStrings = (logger) =>
  extractPackageDetails({
    url: import.meta.url,
    extract: ({ name, version }) => ({
      defaultLogPreamble: `${name}[${version}]:`,
      defaultEditWarning: `DO NOT EDIT THIS FILE AS IT IS GENERATED BY ${name}`,
    }),
    logger,
  });

export const toYAML = (x) => yaml.dump(x);
export const toMultiline = (array) => array.reduce((acc, current) => `${acc}${current}\n`, '');
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
    Object.entries(files).map(async ([configurationPath, { configuration, formatters }]) => {
      const content = formatters.reduce((content, format) => format(content), configuration);
      // The modified file location depends on the structure of the project being scaffolded
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.writeFile(configurationPath, content);
      logStep(`${configurationPath} deployed`);
    })
  );

const lintCommand = 'npx --no-install eslint .';
const addAdocTag = (commands) => ['# tag::commands[]', commands, '# end::commands[]'];

const huskyHooks = {
  'pre-commit': addAdocTag([lintCommand]),
  'pre-push': addAdocTag([`npx --no-install r2d2bzh-js-rules isWip || ${lintCommand} && npm test`]),
};

const setHuskyHooks = (logStep) => (hooks) => {
  husky.install();
  Object.entries(hooks).forEach(([name, commands]) => {
    const hook = path.join('.husky', name);
    husky.set(hook, '');
    commands.forEach((command) => husky.add(hook, command));
    logStep(`${hook} deployed`);
  });
};

const _install = async ({
  editWarning,
  logPreamble,
  tweakConfigurationFiles = (f) => f,
  tweakHuskyHooks = (h) => h,
  stepLogger,
  resultLogger,
} = {}) => {
  try {
    const logStep = (...args) => stepLogger.log(logPreamble, ...args);
    await setConfiguration(logStep)(await tweakConfigurationFiles(configurationFiles(addHashedHeader(editWarning))));
    setHuskyHooks(logStep)(await tweakHuskyHooks(huskyHooks));
    resultLogger.log(logPreamble, 'successfully deployed');
  } catch (e) {
    resultLogger.error(logPreamble, `installation failed: ${e.message ? e.message : e}`);
    throw e;
  }
};

export const install = async ({ logger = console, ...options } = {}) => {
  const { defaultLogPreamble, defaultEditWarning } = await jsRulesStrings(logger);
  return _install({
    stepLogger: logger,
    resultLogger: logger,
    editWarning: defaultEditWarning,
    logPreamble: defaultLogPreamble,
    ...options,
  });
};

export default {
  install,
  readJSONFile,
  extractPackageDetails,
  toMultiline,
  toYAML,
  addHeader,
  addHashedHeader,
};
