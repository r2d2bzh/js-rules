import { promises as fs } from 'node:fs';
import path from 'node:path';
import { configure as configureHusky } from '@gautaz/husky';
import yaml from 'js-yaml';
import { findUp } from 'find-up';

export const readJSONFile = async (path) => {
  try {
    // The purpose of this library is to scaffold based on existing project content
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const json = await fs.readFile(path);
    return JSON.parse(json);
  } catch (error) {
    throw new Error(`failed to extract JSON from ${path} (${error.message})`);
  }
};

export const extractPackageDetails = async ({ url, extract = (x) => x, logger }) => {
  try {
    const packageJSONPath = await findUp('package.json', { cwd: path.dirname(new URL(url).pathname) });
    return extract(await readJSONFile(packageJSONPath));
  } catch (error) {
    logger.error(`Unable to get ${url} package details:`, error.message);
    throw error;
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
export const toMultiline = (array) => `${array.join('\n')}\n`;
export const addHeader =
  (prefix = '', postfix = '\n') =>
  (header = '') => {
    const iterableHeader =
      Symbol.iterator in new Object(header) && Object.prototype.toString.call(header) !== '[object String]'
        ? header
        : [header];
    let formattedHeader = '';
    for (const header_ of iterableHeader) {
      formattedHeader += `${`${prefix}${header_}`.trimEnd()}${postfix}`;
    }
    return (content = '') => `${formattedHeader}${content}`;
  };
export const addHashedHeader = addHeader('# ');

const eslintConfiguration = {
  extends: ['@r2d2bzh'],
  settings: {
    // avoid https://github.com/import-js/eslint-plugin-import/issues/2352 for ava 4.0
    'import/core-modules': ['ava'],
  },
};
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
      let content = configuration;
      for (const format of formatters) {
        content = format(content);
      }
      // The modified file location depends on the structure of the project being scaffolded
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.writeFile(configurationPath, content);
      logStep(`${configurationPath} deployed`);
    })
  );

const lintCommand = 'npx --no-install eslint .';
const addAdocTag = (commands) => ['# tag::commands[]', ...commands, '# end::commands[]'];

const huskyHooks = {
  'pre-commit': addAdocTag([lintCommand]),
  'pre-push': addAdocTag([`npx --no-install r2d2bzh-js-rules isWIP || ${lintCommand} && npm test`]),
};

const setHuskyHooks = (logger) => {
  const husky = configureHusky({
    log: logger.log.bind(logger),
    error: logger.error.bind(logger),
  });
  return (hooks) => {
    husky.install();
    for (const [name, commands] of Object.entries(hooks)) {
      const hook = path.join('.husky', name);
      husky.set(hook, '');
      for (const command of commands) {
        husky.add(hook, command);
      }
      logger.log(`${hook} deployed`);
    }
  };
};

const _install = async ({
  editWarning,
  tweakConfigurationFiles = (f) => f,
  tweakHuskyHooks = (h) => h,
  logger,
} = {}) => {
  try {
    const logStep = (...arguments_) => logger.log(...arguments_);
    await setConfiguration(logStep)(await tweakConfigurationFiles(configurationFiles(addHashedHeader(editWarning))));
    setHuskyHooks(logger)(await tweakHuskyHooks(huskyHooks));
    logger.log('successfully deployed');
  } catch (error) {
    logger.error(`installation failed: ${error.message ? error.message : error}`);
    throw error;
  }
};

export const install = async ({ logger, ...options } = {}) => {
  const defaultLogger = console;
  const { defaultLogPreamble, defaultEditWarning } = await jsRulesStrings(logger || defaultLogger);
  const defaultLoggerWithPreamble = {
    log: (...arguments_) => defaultLogger.log(defaultLogPreamble, ...arguments_),
    warn: (...arguments_) => defaultLogger.warn(defaultLogPreamble, ...arguments_),
    error: (...arguments_) => defaultLogger.error(defaultLogPreamble, ...arguments_),
  };
  return _install({
    logger: logger || defaultLoggerWithPreamble,
    editWarning: defaultEditWarning,
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
