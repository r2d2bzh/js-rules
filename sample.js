// JSON import is still experimental: --experimental-json-modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sample = require('./sample.json');
console.log(sample);
