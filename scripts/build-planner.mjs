import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p,root),'utf8');
const [template,css,core,app]=await Promise.all(['planner/template.html','planner/style.css','planner/core.mjs','planner/app.js'].map(read));
const html=template.replace('/*__CSS__*/',()=>css).replace('/*__APP__*/',()=>core.replace(/^export /gm,'')+'\n'+app);
await mkdir(new URL('public/',root),{recursive:true});
await Promise.all(['index.html','public/team-planner.html'].map(p=>writeFile(new URL(p,root),html,'utf8')));
console.log('Built index.html and public/team-planner.html (standalone, no external assets).');
