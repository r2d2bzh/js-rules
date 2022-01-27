#!/usr/bin/env node
import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { install } from './index.js';
import isWIP from './is-wip.js';

yargs(hideBin(process.argv))
  .command(['install', '$0'], 'Apply the JS rules', {}, install)
  .command('isWIP', 'Check if the current branch name reflects a work in progress', {}, async () => {
    process.exitCode = (await isWIP(process.cwd())) ? 0 : 1;
  })
  .help().argv;
