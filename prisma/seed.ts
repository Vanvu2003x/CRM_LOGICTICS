import {execFileSync} from "node:child_process";
execFileSync(process.execPath,["prisma/seed.cjs"],{stdio:"inherit"});
