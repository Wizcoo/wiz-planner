import { mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const qa=join(root,'.qa');
mkdirSync(qa,{recursive:true});
const cwd=mkdtempSync(join(qa,'test-run-'));
const files=readdirSync(join(root,'test')).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>join(root,'test',name));
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{cwd,stdio:'inherit',windowsHide:true});
if(result.error)console.error(result.error.message);
process.exitCode=result.status??1;
