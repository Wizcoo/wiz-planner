export const PALETTE = ['#6676d9', '#4c99b1', '#56a78a', '#d49a51', '#c77895', '#9273c0', '#d4756e', '#7f8b9c'];
export const STATUS = { todo: '未开始', in_progress: '进行中', review: '待验收', done: '已完成' };
export function dateKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function parseDay(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,12); }
export function addDays(s,n) { const d = parseDay(s); d.setDate(d.getDate()+n); return dateKey(d); }
export function dayDiff(a,b) { return Math.round((Date.UTC(...a.split('-').map((v,i)=>i===1?Number(v)-1:Number(v)))-Date.UTC(...b.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))))/86400000); }
export function validDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= '1900-01-01' && s <= '2200-12-31' && dateKey(parseDay(s)) === s; }
export function uid() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function validateData(input) {
  const fail = (s) => { throw new Error(`数据格式不正确：${s}`); };
  if (!input || input.version !== 1 || typeof input.workspaceId !== 'string' || !/^[\w-]{1,100}$/.test(input.workspaceId)) fail('版本或工作区标识');
  const d = structuredClone(input), ids = {};
  const string = (s, max=200) => typeof s === 'string' && s.trim().length>0 && s.length<=max;
  const color = s => /^#[0-9a-f]{6}$/i.test(s);
  for (const key of ['projects','members','tasks','milestones']) {
    if (!Array.isArray(d[key]) || d[key].length>10000) fail(key);
    ids[key] = new Set();
    for (const row of d[key]) {
      if (!row || typeof row !== 'object' || !string(row.id,100) || !/^[\w-]+$/.test(row.id) || ids[key].has(row.id)) fail(`${key} 标识重复或无效`);
      ids[key].add(row.id);
    }
  }
  for (const p of d.projects) if (!string(p.name,100) || !color(p.color)) fail('项目名称或颜色');
  for (const m of d.members) if (!string(m.name,60) || !string(m.role,80) || !color(m.color)) fail('成员名称、角色或颜色');
  for (const t of d.tasks) {
    if (!string(t.title) || !ids.projects.has(t.projectId) || !ids.members.has(t.assigneeId)) fail('任务名称、项目或负责人');
    if (!validDate(t.startDate) || !validDate(t.endDate) || t.startDate>t.endDate || (t.deadline && !validDate(t.deadline))) fail('任务日期');
    if (!['P0','P1','P2'].includes(t.priority) || !Object.hasOwn(STATUS,t.status) || !color(t.color)) fail('优先级、状态或颜色');
    if (!Number.isInteger(t.progress) || t.progress<0 || t.progress>100 || typeof t.description!=='string' || t.description.length>10000) fail('进度或备注');
    if (t.completedAt != null && !validDate(t.completedAt)) fail('完成日期');
    if (t.status==='done') t.progress=100;
  }
  for (const m of d.milestones) {
    if (!string(m.title) || !validDate(m.date) || !ids.projects.has(m.projectId) || (m.taskId && !ids.tasks.has(m.taskId)) || !['pending','achieved'].includes(m.status)) fail('里程碑');
    if (m.taskId && d.tasks.find(t=>t.id===m.taskId).projectId!==m.projectId) fail('里程碑与关联任务必须属于同一项目');
  }
  return d;
}
export function filterTasks(data, f={}) {
  const q=(f.search||'').trim().toLowerCase();
  return data.tasks.filter(t=>(!f.project || t.projectId===f.project) && (!f.member || t.assigneeId===f.member) && (!f.priority || t.priority===f.priority) && (!f.status || t.status===f.status) && (!q || [t.title,t.description,data.members.find(m=>m.id===t.assigneeId)?.name].join(' ').toLowerCase().includes(q)));
}
export function todayGroups(tasks,today) {
  const rank=(a,b)=>a.priority.localeCompare(b.priority)||(a.deadline||a.endDate).localeCompare(b.deadline||b.endDate);
  return {
    overdue: tasks.filter(t=>t.status!=='done' && (t.deadline||t.endDate)<today).sort(rank),
    active: tasks.filter(t=>t.status!=='done' && (t.deadline||t.endDate)>=today && (t.startDate<=today||t.deadline===today)).sort(rank),
    upcoming: tasks.filter(t=>t.status!=='done' && t.startDate>today && (t.deadline||t.endDate)>today).sort((a,b)=>a.startDate.localeCompare(b.startDate)),
    done: tasks.filter(t=>t.status==='done' && t.completedAt===today)
  };
}
export function createDemo(today=dateKey()) {
  const projects=[{id:'p1',name:'产品研发 · V2.0',color:PALETTE[0]},{id:'p2',name:'团队与日常',color:PALETTE[2]}];
  const members=[{id:'m1',name:'我',role:'项目负责人',color:PALETTE[0]},{id:'m2',name:'Alex',role:'算法工程师',color:PALETTE[1]},{id:'m3',name:'Emma',role:'产品设计师',color:PALETTE[4]},{id:'m4',name:'Ben',role:'硬件工程师',color:PALETTE[3]},{id:'m5',name:'Chris',role:'软件工程师',color:PALETTE[5]}];
  const rows=[['确定本周交付范围','m1',-2,1,'P0',65],['团队周会与进度同步','m1',0,0,'P1',0],['整理验收清单','m1',3,6,'P2',0],['位移算法验证','m2',-3,3,'P0',55],['完成测试数据复核','m2',1,7,'P1',20],['交互原型与视觉规范','m3',-4,2,'P1',80],['关键页面设计评审','m3',4,5,'P2',0],['传感器联调','m4',-1,5,'P0',35],['硬件测试报告','m4',6,9,'P1',0],['本地数据存储与备份','m5',-2,4,'P1',40],['功能集成与回归','m5',5,10,'P0',0],['回复待确认事项','m1',-3,-1,'P1',0]];
  const tasks=rows.map(([title,assigneeId,start,end,priority,progress],i)=>({id:`t${i+1}`,title,assigneeId,projectId:i===1||i===11?'p2':'p1',startDate:addDays(today,start),endDate:addDays(today,end),deadline:addDays(today,end),priority,progress,status:progress?'in_progress':'todo',color:members.find(m=>m.id===assigneeId).color,description:'演示任务，可点击编辑或删除。',completedAt:null}));
  return {version:1,workspaceId:'wiz-local-v1',name:'我的团队空间',projects,members,tasks,milestones:[{id:'ms1',projectId:'p1',taskId:'',title:'方案评审',date:addDays(today,2),status:'pending'},{id:'ms2',projectId:'p1',taskId:'',title:'V2.0 交付',date:addDays(today,10),status:'pending'}]};
}
export function convertLegacy({projects,members,tasks,milestones}) {
  return validateData({version:1,workspaceId:uid(),name:'原版项目导入',projects:projects.map(p=>({id:p.id,name:p.name,color:p.color})),members:members.map(m=>({id:m.id,name:m.name,role:m.role,color:m.avatarColor})),tasks:tasks.map(t=>({...t,deadline:t.endDate,priority:({urgent:'P0',high:'P0',medium:'P1',low:'P2'})[t.priority]||t.priority,description:t.description||'',completedAt:null})),milestones:milestones.map(m=>({...m,taskId:m.taskId||''}))});
}
