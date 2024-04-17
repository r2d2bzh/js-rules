import fs from 'node:fs';
import { currentBranch } from 'isomorphic-git';

const isWIP = /(^|.*\/)wip\//i;

const isCurrentBranchWIP = async (directory) => isWIP.test(await currentBranch({ fs, dir: directory }));

export default isCurrentBranchWIP;
