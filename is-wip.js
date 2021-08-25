import fs from 'fs';
import { currentBranch } from 'isomorphic-git';

const isWIP = /(^|.*\/)wip\//i;

export default async (dir) => isWIP.test(await currentBranch({ fs, dir }));
