import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createDemo, validateData, dateKey, validDate, addDays, dayDiff, todayGroups, filterTasks, escapeHtml, convertLegacy } from '../planner/core.mjs';

test('date-only arithmetic handles month/year boundaries and leap days',()=>{
  assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(addDays('2024-02-28',1),'2024-02-29');
  assert.equal(dayDiff('2026-03-10','2026-03-07'),3);
  assert.equal(validDate('2026-02-29'),false);
  assert.equal(validDate('2026-04-31'),false);
  assert.equal(validDate('2024-02-29'),true);
  assert.equal(dateKey(new Date(2026,9,28,23,59)),'2026-10-28');
});
test('JSON roundtrip preserves every entity and independent deadlines',()=>{
  const d=createDemo('2026-10-28');d.tasks[0].deadline='2026-11-15';
  assert.deepEqual(validateData(JSON.parse(JSON.stringify(d))),d);
  assert.notEqual(d.tasks[0].deadline,d.tasks[0].endDate);
  assert.ok(d.tasks.filter(t=>t.assigneeId==='m1').length>1);
});
test('import rejects invalid relationships, duplicate IDs, colors, status, priorities and impossible dates atomically',()=>{
  const d=createDemo('2026-10-28');
  for(const mutation of [x=>x.tasks[0].assigneeId='missing',x=>x.tasks[0].startDate='2026-02-30',x=>x.tasks[0].endDate='2025-01-01',x=>x.tasks[0].priority='urgent',x=>x.tasks[0].color='red;display:none',x=>x.tasks[0].status='constructor',x=>x.tasks[0].progress=NaN,x=>x.tasks.push({...x.tasks[0]}),x=>x.milestones[0].taskId='missing',x=>x.milestones[0].taskId='t2']){
    const next=structuredClone(d);mutation(next);assert.throws(()=>validateData(next));
  }
  assert.deepEqual(d,createDemo('2026-10-28'));
});
test('today includes deadlines before planned start, overdue work, extended work, and only today completions',()=>{
  const base=createDemo('2026-10-28').tasks[0];
  const tasks=[
    {...base,id:'late',deadline:'2026-10-27'},
    {...base,id:'extended',endDate:'2026-10-27',deadline:'2026-10-31'},
    {...base,id:'deadline-first',startDate:'2026-11-02',endDate:'2026-11-05',deadline:'2026-10-28'},
    {...base,id:'next',startDate:'2026-10-30',endDate:'2026-11-02',deadline:'2026-11-02'},
    {...base,id:'done-today',status:'done',completedAt:'2026-10-28'},
    {...base,id:'done-before',status:'done',completedAt:'2026-10-27'},
  ];
  const g=todayGroups(tasks,'2026-10-28');
  assert.deepEqual(g.overdue.map(x=>x.id),['late']);
  assert.deepEqual(new Set(g.active.map(x=>x.id)),new Set(['extended','deadline-first']));
  assert.deepEqual(g.upcoming.map(x=>x.id),['next']);
  assert.deepEqual(g.done.map(x=>x.id),['done-today']);
});
test('filters combine project, owner, priority, status and search',()=>{
  const d=createDemo('2026-10-28');
  assert.deepEqual(filterTasks(d,{project:'p1',member:'m1',priority:'P0',status:'in_progress',search:'交付'}).map(x=>x.id),['t1']);
  assert.equal(filterTasks(d,{member:'m2',search:'Alex'}).length,2);
  assert.equal(filterTasks(d,{search:'no-such-task'}).length,0);
});
test('legacy import maps priorities and preserves data without mutating source',()=>{
  const source=createDemo('2026-10-28');
  const old={...source,members:source.members.map(m=>({...m,avatarColor:m.color})),tasks:source.tasks.map(t=>({...t,priority:'high'}))};
  const result=convertLegacy(old);
  assert.equal(result.tasks[0].priority,'P0');assert.equal(result.tasks[0].deadline,old.tasks[0].endDate);
  assert.equal(old.tasks[0].priority,'high');assert.equal(result.members[0].color,old.members[0].avatarColor);
});
test('standalone HTML has no external runtime assets and bundled JavaScript parses',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.equal(/<script[^>]+src=|<link[^>]+href=/.test(html),false);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);
  new vm.Script(scripts[0][1]);
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(html,await readFile(new URL('../public/team-planner.html',import.meta.url),'utf8'));
});
