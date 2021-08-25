import fs from 'fs';
import git from 'isomorphic-git';

const isWIP = /(^|.*\/)wip\//i;

export default async (dir) => isWIP.test(await git.currentBranch({ fs, dir }));
