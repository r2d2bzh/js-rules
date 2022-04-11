import fs from 'node:fs';
import { currentBranch } from 'isomorphic-git';

const isWIP = /(^|.*\/)wip\//i;

export default async (directory) => isWIP.test(await currentBranch({ fs, dir: directory }));
