(() => {
  'use strict';
  const $=s=>document.querySelector(s), esc=escapeHtml;
  const embedded=JSON.parse($('#planner-data').textContent || 'null');
  let data=embedded?validateData(embedded):createDemo(), key=`wiz-planner:${data.workspaceId}`, storageBlocked=false, saveError=false;
  let prefs={view:'timeline',project:'',member:'',priority:'',status:'',search:'',me:'m1',theme:'light',days:14};
  let today=dateKey(), anchor=addDays(today,-2), month=today.slice(0,7)+'-01', editing=null, toastTimer, pendingConfirm=null, drag=null, suppressClickUntil=0;
  try { const raw=localStorage.getItem(key); if(raw) data=validateData(JSON.parse(raw)); const saved=JSON.parse(localStorage.getItem(key+':prefs')||'{}'); prefs={...prefs,...saved,search:'',priority:'',status:''}; }
  catch(e) { storageBlocked=true; $('#storage-warning').hidden=false; $('#storage-warning').textContent='本地存储不可用或数据无法读取。当前显示文件内的数据；请先导出备份。导入 JSON 或创建空白工作区可重新开始。'; }
  if(!data.members.some(m=>m.id===prefs.me)) prefs.me=data.members[0]?.id||'';
  if(!data.projects.some(p=>p.id===prefs.project)) prefs.project='';
  if(!data.members.some(m=>m.id===prefs.member)) prefs.member='';
  if(!['timeline','calendar','today','tasks','milestones'].includes(prefs.view)) prefs.view='timeline';
  if(![7,14,30].includes(prefs.days)) prefs.days=14;
  const viewNames={timeline:'团队时间轴',calendar:'日历',today:'我的一天',tasks:'全部任务',milestones:'里程碑'};
  const icons={timeline:'▤',calendar:'▦',today:'☀',tasks:'☷',milestones:'◇'};
  const descriptions={timeline:'把计划放在一起，让协作清晰可见。',calendar:'从月历看安排，为重要的事情留出时间。',today:'一步一步，完成今天最重要的事。',tasks:'所有承诺与进展，都在这里。',milestones:'记下值得抵达的每一个节点。'};
  function notify(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500); }
  function remember() { try { localStorage.setItem(key+':prefs',JSON.stringify(prefs)); } catch{} }
  function persist() {
    if(storageBlocked) { saveError=true; notify('尚未写入浏览器，请导出 JSON 保存'); return; }
    try { localStorage.setItem(key,JSON.stringify(data)); saveError=false; $('#storage-warning').hidden=true; }
    catch { saveError=true; $('#storage-warning').hidden=false; $('#storage-warning').textContent='浏览器存储失败，当前修改只在内存中。请立即通过「备份与导入」导出 JSON 或 HTML。'; notify('保存失败，请导出文件备份'); }
  }
  function commit(change,message='已保存') {
    try { const next=structuredClone(data); change(next); data=validateData(next); persist(); render(); if(!saveError)notify(message); return true; }
    catch(e){notify(e.message);return false;}
  }
  function ask(title,message,action) { pendingConfirm=action; $('#confirm-title').textContent=title; $('#confirm-message').textContent=message; $('#confirm-dialog').showModal(); }
  $('#confirm-dialog').addEventListener('close',()=>{const fn=pendingConfirm;pendingConfirm=null;if($('#confirm-dialog').returnValue==='confirm')fn?.();$('#confirm-dialog').returnValue='';});
  function member(id){return data.members.find(m=>m.id===id);}
  function project(id){return data.projects.find(p=>p.id===id);}
  function avatar(m){return m?`<span class="avatar" style="--c:${m.color}">${esc(m.name.slice(0,1).toUpperCase())}</span>`:'';}
  function priority(t){return `<span class="priority ${t.priority}">${t.priority}</span>`;}
  function shortDate(s){return s?`${Number(s.slice(5,7))}/${Number(s.slice(8,10))}`:'未设置';}
  function readableDate(s){return parseDay(s).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});}
  function visibleTasks(){return filterTasks(data,{...prefs,member:prefs.view==='today'?prefs.me:prefs.member});}
  function visibleMilestones(){const taskIds=new Set(visibleTasks().map(t=>t.id));return data.milestones.filter(m=>(!prefs.project||m.projectId===prefs.project)&&(!prefs.search||m.title.toLowerCase().includes(prefs.search.toLowerCase()))&&(!prefs.member||m.taskId&&taskIds.has(m.taskId)));}
  function empty(title='这里还没有任务',description='添加一个任务，让计划从这里开始。'){return `<div class="empty"><div class="empty-symbol">☷</div><h3>${esc(title)}</h3><p>${esc(description)}</p><button data-action="new-task">＋ 新建任务</button></div>`;}
  function renderSidebar(){
    const groups=todayGroups(filterTasks(data,{member:prefs.me}),today);
    $('#navigation').innerHTML=Object.keys(viewNames).map(v=>`<button class="nav-item ${prefs.view===v?'active':''}" data-view="${v}"><span class="nav-icon">${icons[v]}</span>${viewNames[v]}${v==='today'?`<span class="nav-count">${groups.active.length+groups.overdue.length}</span>`:v==='tasks'?`<span class="nav-count">${data.tasks.length}</span>`:''}</button>`).join('');
    $('#projects').innerHTML=`<button class="project-row ${!prefs.project?'active':''}" data-project=""><span class="project-dot" style="background:#a8afc0"></span>所有项目</button>`+data.projects.map(p=>`<div class="project-wrap"><button class="project-row ${prefs.project===p.id?'active':''}" data-project="${p.id}"><span class="project-dot" style="background:${p.color}"></span><span class="row-name">${esc(p.name)}</span></button><button class="row-edit" data-edit-project="${p.id}" aria-label="编辑项目 ${esc(p.name)}">···</button></div>`).join('');
    $('#members').innerHTML=data.members.map(m=>`<div class="member-wrap"><button class="member-row ${prefs.member===m.id?'active':''}" data-member="${m.id}">${avatar(m)}<span class="member-info"><span>${esc(m.name)}</span><small>${esc(m.role)}</small></span></button><button class="row-edit" data-edit-member="${m.id}" aria-label="编辑成员 ${esc(m.name)}">···</button></div>`).join('');
    $('#my-member').innerHTML=`<option value="">选择我的身份</option>`+data.members.map(m=>`<option value="${m.id}" ${m.id===prefs.me?'selected':''}>${esc(m.name)}</option>`).join('');
    $('#save-status').textContent=saveError||storageBlocked?'未保存 · 请导出备份':'自动保存到此浏览器';
    $('#avatar-stack').innerHTML=data.members.slice(0,5).map(avatar).join('');$('#team-count').textContent=`${data.members.length} 位成员 · 本地工作空间`;
  }
  function renderStats(tasks){
    const active=tasks.filter(t=>t.status==='in_progress').length, done=tasks.filter(t=>t.status==='done').length, due=tasks.filter(t=>t.status!=='done'&&(t.deadline||t.endDate)<=today).length;
    const items=[['▤','任务总览',tasks.length,'项任务','#7482cd','#edf0fb'],['◷','正在进行',active,'项进行中','#d5a153','#fbf4e7'],['✓','已完成',done,'项已交付','#64a990','#edf7f2'],['⚑','到期提醒',due,'项今日 / 逾期','#cf8379','#fbefec']];
    $('#stats').innerHTML=items.map(([icon,label,n,sub,c,tint])=>`<div class="stat"><div class="stat-icon" style="--c:${c};--tint:${tint}">${icon}</div><div><small>${label}</small><div class="stat-number">${n}<span>${sub}</span></div></div></div>`).join('');
  }
  function render(){
    document.documentElement.dataset.theme=prefs.theme;
    const tasks=visibleTasks(); renderSidebar();renderStats(tasks);
    $('#breadcrumb-title').textContent=viewNames[prefs.view];$('#page-title').innerHTML=`${viewNames[prefs.view]}<span class="title-dot">.</span>`;$('#page-description').textContent=descriptions[prefs.view];
    $('#eyebrow').textContent=prefs.view==='today'?parseDay(today).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase():'PLAN TOGETHER, MOVE FORWARD';
    $('#view-tabs').innerHTML=['timeline','calendar','today'].map(v=>`<button data-view="${v}" class="${prefs.view===v?'active':''}">${icons[v]} ${v==='timeline'?'时间轴':v==='today'?'今日待办':'月历'}</button>`).join('');
    $('#priority-filter').value=prefs.priority;$('#status-filter').value=prefs.status;
    $('#footer-info').textContent=`${prefs.project?project(prefs.project)?.name:'所有项目'} · ${tasks.length} 项任务${(prefs.view==='today'?prefs.me:prefs.member)?' · '+(member(prefs.view==='today'?prefs.me:prefs.member)?.name||''):''}`;
    $('#bottom-date').textContent=parseDay(today).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
    const filters=prefs.member||prefs.project||prefs.search||prefs.priority||prefs.status;
    const end=`<div class="toolbar-end">${filters?'<button data-action="clear-filters">清除筛选</button>':''}${prefs.view==='timeline'?`<select id="range-select" aria-label="时间轴范围">${[7,14,30].map(n=>`<option value="${n}" ${prefs.days===n?'selected':''}>${n} 天</option>`).join('')}</select>`:''}<button data-action="new-milestone">◇ 添加里程碑</button></div>`;
    if(prefs.view==='timeline'||prefs.view==='calendar'){
      const d=parseDay(prefs.view==='timeline'?anchor:month);
      const label=prefs.view==='timeline'?`${readableDate(anchor)} — ${readableDate(addDays(anchor,prefs.days-1))} · ${d.getFullYear()}`:`${d.getFullYear()} 年 ${d.getMonth()+1} 月`;
      $('#view-toolbar').innerHTML=`<div class="period"><strong>${label}</strong><button class="arrow" data-action="prev" aria-label="上一段日期">‹</button><button class="arrow" data-action="next" aria-label="下一段日期">›</button><button data-action="go-today">今天</button></div>${end}`;
    }else $('#view-toolbar').innerHTML=`<div class="period"><strong>${prefs.view==='today'?`${readableDate(today)} · ${member(prefs.me)?.name||'请先选择我的身份'}`:prefs.view==='milestones'?'关键节点':'任务清单'}</strong>${prefs.member&&prefs.view!=='today'?`<span class="filter-chip">${esc(member(prefs.member)?.name)}</span>`:''}</div>${end}`;
    if(prefs.view==='timeline') renderTimeline(tasks);else if(prefs.view==='calendar')renderCalendar(tasks);else if(prefs.view==='milestones')renderMilestones();else renderAgenda(tasks);
    remember();
  }
  function renderTimeline(tasks){
    const days=Array.from({length:prefs.days},(_,i)=>addDays(anchor,i)), end=days.at(-1), todayOffset=dayDiff(today,anchor), unit=100/prefs.days;
    const todayLine=todayOffset>=0&&todayOffset<prefs.days?`<i class="today-line" style="left:${(todayOffset+.5)*unit}%"></i>`:'';
    let html=`<div class="gantt" style="--days:${prefs.days};min-width:${230+prefs.days*(prefs.days===30?30:49)}px"><div class="gantt-head"><div class="gantt-label">成员 / 任务 <span style="margin-left:auto">优先级</span></div><div class="days">${days.map(s=>`<div class="day ${[0,6].includes(parseDay(s).getDay())?'weekend':''} ${s===today?'today':''}"><small>${['日','一','二','三','四','五','六'][parseDay(s).getDay()]}</small><b>${s.slice(8)==='01'?Number(s.slice(5,7))+'/1':Number(s.slice(8))}</b></div>`).join('')}</div></div>`;
    const milestones=visibleMilestones().filter(m=>m.date>=anchor&&m.date<=end).sort((a,b)=>a.date.localeCompare(b.date));
    const milestoneLanes=[];
    const chips=milestones.map(m=>{const off=dayDiff(m.date,anchor);let lane=milestoneLanes.findIndex(last=>off-last>3);if(lane<0)lane=milestoneLanes.length;milestoneLanes[lane]=off;return `<button class="milestone-chip" data-edit-milestone="${m.id}" title="${esc(m.title)} · ${m.date}" style="left:clamp(0px,${(off+.5)*unit}%,calc(100% - 115px));top:${9+lane*29}px">◆ ${esc(m.title)}${m.status==='achieved'?' ✓':''}</button>`;}).join('');
    html+=`<div class="gantt-milestones" style="height:${Math.max(47, milestoneLanes.length*29+18)}px"><div class="gantt-label">◇ 项目里程碑</div><div class="track milestone-track">${todayLine}${chips}</div></div>`;
    const members=data.members.filter(m=>!prefs.member||prefs.member===m.id);
    for(const m of members){
      const list=tasks.filter(t=>t.assigneeId===m.id).sort((a,b)=>a.startDate.localeCompare(b.startDate));
      if(!list.length&&(prefs.search||prefs.priority||prefs.status))continue;
      html+=`<div class="gantt-member" style="--c:${m.color}"><div class="gantt-label">${avatar(m)}<span class="member-meta">${esc(m.name)}<small>${esc(m.role)}</small></span><button data-new-for="${m.id}" style="margin-left:auto;padding:0 5px;border:0;background:transparent;color:var(--muted)" aria-label="为 ${esc(m.name)} 添加任务">＋</button></div><div class="track">${todayLine}<span style="font-size:9px;color:var(--muted);position:absolute;left:12px;top:16px">${list.length} 项任务</span></div></div>`;
      for(const t of list){
        const start=Math.max(0,dayDiff(t.startDate,anchor)),finish=Math.min(prefs.days,dayDiff(t.endDate,anchor)+1), visible=finish>start, deadline=t.deadline?dayDiff(t.deadline,anchor):-1;
        html+=`<div class="gantt-task" style="--c:${t.color}"><div class="gantt-label"><button class="check ${t.status==='done'?'checked':''}" data-toggle-task="${t.id}" aria-label="${t.status==='done'?'重新打开':'完成'} ${esc(t.title)}">${t.status==='done'?'✓':''}</button><button class="task-name ${t.status==='done'?'task-done':''}" data-edit-task="${t.id}" title="${esc(t.title)}">${esc(t.title)}</button>${priority(t)}</div><div class="track" data-track="${t.id}">${todayLine}${deadline>=0&&deadline<prefs.days?`<i class="deadline-pin" style="left:${(deadline+.92)*unit}%" title="Deadline ${t.deadline}"></i>`:''}${visible?`<button class="task-bar" data-edit-task="${t.id}" data-drag-task="${t.id}" style="left:calc(${start*unit}% + 4px);width:calc(${(finish-start)*unit}% - 8px);--c:${t.color}" title="${esc(t.title)}\n${t.startDate} → ${t.endDate}\nDeadline: ${t.deadline||'未设置'} · ${STATUS[t.status]} · ${t.progress}%\n拖动调整计划日期，deadline 保持不变"><span class="bar-fill" style="width:${t.progress}%"></span><span>${t.startDate<anchor?'‹ ':''}${esc(t.title)}${t.endDate>end?' ›':''}</span><span class="bar-priority">${t.progress?`${t.progress}%`:t.priority}</span></button>`:`<button data-jump-task="${t.id}" style="position:absolute;top:10px;left:10px;padding:3px 7px;font-size:9px;color:var(--muted)">${shortDate(t.startDate)} — ${shortDate(t.endDate)} · 定位 →</button>`}</div></div>`;
      }
    }
    html+='</div>';
    $('#view-content').innerHTML=data.members.length?html:empty('先添加一位团队成员','在左侧点击「团队成员」旁的 ＋，建立你的团队。');
  }
  function renderCalendar(tasks){
    const first=parseDay(month), start=addDays(month,-((first.getDay()+6)%7));
    const ms=visibleMilestones();
    $('#view-content').innerHTML=`<div class="calendar"><div class="week-labels">${['周一','周二','周三','周四','周五','周六','周日'].map(x=>`<div>${x}</div>`).join('')}</div><div class="calendar-grid">${Array.from({length:42},(_,i)=>{const s=addDays(start,i), list=tasks.filter(t=>t.startDate<=s&&t.endDate>=s), deadlines=tasks.filter(t=>t.deadline===s&&!(t.startDate<=s&&t.endDate>=s));return `<div class="calendar-cell ${s.slice(0,7)!==month.slice(0,7)?'outside':''} ${s===today?'today':''}"><button class="day-number" data-new-date="${s}" title="在 ${s} 新建任务">${Number(s.slice(8))}</button>${ms.filter(m=>m.date===s).map(m=>`<button class="calendar-task milestone" data-edit-milestone="${m.id}">◆ ${esc(m.title)}</button>`).join('')}${list.map(t=>`<button class="calendar-task ${t.status==='done'?'task-done':''}" style="--c:${t.color}" data-edit-task="${t.id}" title="${esc(t.title)} · ${esc(member(t.assigneeId)?.name)} · ${t.priority}${t.deadline===s?' · 今日截止':''}">${t.deadline===s?'⚑ ':''}${esc(t.title)}</button>`).join('')}${deadlines.map(t=>`<button class="calendar-task deadline" data-edit-task="${t.id}">⚑ 截止 · ${esc(t.title)}</button>`).join('')}</div>`;}).join('')}</div></div>`;
  }
  function taskRow(t){
    const due=t.deadline||t.endDate, late=t.status!=='done'&&due<today;
    return `<div class="agenda-task" style="--c:${t.color}"><button class="check ${t.status==='done'?'checked':''}" data-toggle-task="${t.id}" aria-label="${t.status==='done'?'重新打开':'完成'} ${esc(t.title)}">${t.status==='done'?'✓':''}</button><div class="task-copy"><button data-edit-task="${t.id}" class="task-title-button ${t.status==='done'?'task-done':''}">${esc(t.title)}</button><div class="task-subline"><span>${esc(project(t.projectId)?.name)}</span><span>${shortDate(t.startDate)} — ${shortDate(t.endDate)}</span><span class="${late?'overdue':''}">${late?`逾期 ${dayDiff(today,due)} 天`:due===today?'今天到期':`截止 ${shortDate(due)}`}${t.deadline?'':'（计划）'}</span><span>${STATUS[t.status]}</span></div></div>${priority(t)}<div class="progress-copy">${t.progress}%<div class="progress-track"><span style="width:${t.progress}%"></span></div></div><span title="${esc(member(t.assigneeId)?.name)}">${avatar(member(t.assigneeId))}</span></div>`;
  }
  function renderAgenda(tasks){
    if(prefs.view==='today'){
      if(!prefs.me){$('#view-content').innerHTML=empty('选择你的身份','在侧栏底部选择「我的身份」，这里会显示你的今日任务。');return;}
      const g=todayGroups(tasks,today), sections=[['overdue','需要跟进','#c77b72'],['active','今天要做','#6876d5'],['upcoming','接下来','#9298ad'],['done','今天已完成','#64a990']];
      $('#view-content').innerHTML=`<div class="agenda">${sections.map(([k,label,color])=>g[k].length?`<section class="agenda-section"><h3 style="color:${color}">${label}<span>${g[k].length}</span></h3>${g[k].map(taskRow).join('')}</section>`:'').join('')||empty('今天很从容','没有待处理的任务，或当前筛选下没有结果。')}</div>`;
    }else $('#view-content').innerHTML=tasks.length?`<div class="agenda">${[...tasks].sort((a,b)=>(a.status==='done')-(b.status==='done')||a.priority.localeCompare(b.priority)||(a.deadline||a.endDate).localeCompare(b.deadline||b.endDate)).map(taskRow).join('')}</div>`:empty('没有匹配的任务','试试清除筛选，或添加一项新任务。');
  }
  function renderMilestones(){const list=visibleMilestones().sort((a,b)=>a.date.localeCompare(b.date));$('#view-content').innerHTML=list.length?`<div class="milestone-list">${list.map(m=>`<button class="milestone-card" data-edit-milestone="${m.id}"><span class="diamond">${m.status==='achieved'?'✓':'◆'}</span><p>${m.date} · ${m.status==='achieved'?'已达成':m.date<today?'已过计划日期':m.date===today?'就是今天':`还有 ${dayDiff(m.date,today)} 天`}</p><h3>${esc(m.title)}</h3><small>${esc(project(m.projectId)?.name)}${m.taskId?' · '+esc(data.tasks.find(t=>t.id===m.taskId)?.title):''}</small></button>`).join('')}</div>`:`<div class="empty"><div class="empty-symbol">◇</div><h3>下一个值得期待的节点</h3><p>为项目添加评审、验收或交付里程碑。</p><button data-action="new-milestone">＋ 添加里程碑</button></div>`;}
  function options(items,value,label='name'){return items.map(x=>`<option value="${esc(x.id)}" ${x.id===value?'selected':''}>${esc(x[label])}</option>`).join('');}
  function field(label,content,full=false){return `<label class="field ${full?'full':''}"><span>${label}</span>${content}</label>`;}
  function input(name,value,type='text',extra=''){return `<input name="${name}" type="${type}" value="${esc(value||'')}" ${extra}>`;}
  function colorField(color){return `<div class="field full"><span>标记颜色</span><div class="color-options">${PALETTE.map(c=>`<button type="button" class="color-option ${c===color?'selected':''}" data-color="${c}" style="--c:${c}" aria-label="颜色 ${c}" aria-pressed="${c===color}"></button>`).join('')}<input type="color" name="color" value="${color}" aria-label="自定义颜色"></div></div>`;}
  function openEditor(kind,id='',initial={}){
    if((kind==='task'||kind==='milestone')&&!data.projects.length){notify('请先创建一个项目');openEditor('project');return;}
    if(kind==='task'&&!data.members.length){notify('请先添加一位成员');openEditor('member');return;}
    const collection={task:'tasks',member:'members',project:'projects',milestone:'milestones'}[kind];
    const old=data[collection].find(x=>x.id===id);
    const base={task:{title:'',projectId:prefs.project||data.projects[0]?.id,assigneeId:(prefs.view==='today'?prefs.me:prefs.member)||prefs.me||data.members[0]?.id,startDate:today,endDate:today,deadline:today,priority:'P1',status:'todo',progress:0,color:member(prefs.me)?.color||PALETTE[0],description:''},member:{name:'',role:'',color:PALETTE[data.members.length%PALETTE.length]},project:{name:'',color:PALETTE[data.projects.length%PALETTE.length]},milestone:{title:'',projectId:prefs.project||data.projects[0]?.id,date:today,taskId:'',status:'pending'}}[kind];
    const row={...base,...old,...initial};editing={kind,id:old?.id||'',collection};
    const label={task:'任务',member:'成员',project:'项目',milestone:'里程碑'}[kind];
    let fields='';
    if(kind==='task'){
      fields=field('任务名称',input('title',row.title,'text','required maxlength="200" placeholder="接下来，要完成什么？"'),true)+field('项目',`<select name="projectId" required>${options(data.projects,row.projectId)}</select>`)+field('负责人 / 角色',`<select name="assigneeId" required>${data.members.map(m=>`<option value="${m.id}" ${m.id===row.assigneeId?'selected':''}>${esc(m.name)} · ${esc(m.role)}</option>`).join('')}</select>`)+field('计划开始',input('startDate',row.startDate,'date','required min="1900-01-01" max="2200-12-31"'))+field('计划结束',input('endDate',row.endDate,'date','required min="1900-01-01" max="2200-12-31"'))+field('Deadline · 截止日期',input('deadline',row.deadline,'date','min="1900-01-01" max="2200-12-31"'))+field('优先级',`<select name="priority">${['P0','P1','P2'].map((p,i)=>`<option value="${p}" ${p===row.priority?'selected':''}>${p} · ${['紧急重要','优先处理','常规安排'][i]}</option>`).join('')}</select>`)+field('状态',`<select name="status">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${k===row.status?'selected':''}>${v}</option>`).join('')}</select>`)+field('进度（%）',input('progress',String(row.progress),'number','min="0" max="100" step="1" required'))+colorField(row.color)+field('备注',`<textarea name="description" maxlength="10000" placeholder="交付要求、相关资料，或下一步…">${esc(row.description)}</textarea>`,true);
    }else if(kind==='member')fields=field('成员名称',input('name',row.name,'text','required maxlength="60"'),true)+field('角色 / 分工',input('role',row.role,'text','required maxlength="80" placeholder="例如：算法工程师"'),true)+colorField(row.color);
    else if(kind==='project')fields=field('项目名称',input('name',row.name,'text','required maxlength="100"'),true)+colorField(row.color);
    else fields=field('里程碑名称',input('title',row.title,'text','required maxlength="200"'),true)+field('所属项目',`<select name="projectId">${options(data.projects,row.projectId)}</select>`)+field('目标日期',input('date',row.date,'date','required min="1900-01-01" max="2200-12-31"'))+field('关联任务（可选）',`<select name="taskId"><option value="">项目级里程碑</option>${options(data.tasks.filter(t=>t.projectId===row.projectId),row.taskId,'title')}</select>`,true)+field('状态',`<select name="status"><option value="pending" ${row.status==='pending'?'selected':''}>待达成</option><option value="achieved" ${row.status==='achieved'?'selected':''}>已达成</option></select>`);
    $('#editor-form').innerHTML=`<div class="dialog-head"><div><div class="eyebrow">MAKE ROOM FOR WHAT MATTERS</div><h2>${old?'编辑':'新建'}${label}</h2></div><button type="button" data-action="close-editor" class="icon-button" aria-label="关闭编辑">×</button></div><div class="form-grid">${fields}</div><div class="form-error" id="form-error" role="alert"></div>${kind==='task'?'<p class="help" style="font-size:10px">计划日期用于时间轴；Deadline 用于到期提醒。未填写 Deadline 时，按计划结束日提醒。</p>':''}<div class="form-actions">${old?`<button type="button" data-action="delete-record" class="danger-text">删除${label}</button>`:''}<button type="button" data-action="close-editor">取消</button><button class="primary" type="submit">${old?'保存修改':'创建'+label}</button></div>`;
    if(!$('#editor').open)$('#editor').showModal();
  }
  $('#editor-form').addEventListener('submit',e=>{
    e.preventDefault(); const values=Object.fromEntries(new FormData(e.target)), {kind,id,collection}=editing;
    for(const name of ['title','name','role'])if(name in values){values[name]=values[name].trim();if(!values[name]){$('#form-error').textContent='名称与角色不能为空或仅包含空格。';return;}}
    if(kind==='task'){
      if(values.startDate>values.endDate){$('#form-error').textContent='计划结束日期不能早于开始日期。';return;}
      values.progress=Number(values.progress);values.completedAt=values.status==='done'?(data.tasks.find(t=>t.id===id)?.completedAt||today):null;
      if(values.status==='done')values.progress=100;
    }
    const success=commit(d=>{const i=d[collection].findIndex(x=>x.id===id);if(i>=0)d[collection][i]={...d[collection][i],...values};else d[collection].push({id:uid(),...values});if(kind==='task')for(const ms of d.milestones)if(ms.taskId===id)ms.projectId=values.projectId;},'已保存到本地工作区');
    if(success)$('#editor').close();
  });
  $('#editor-form').addEventListener('change',e=>{
    if(e.target.name==='projectId'&&editing.kind==='milestone') $('[name=taskId]').innerHTML='<option value="">项目级里程碑</option>'+options(data.tasks.filter(t=>t.projectId===e.target.value),'','title');
    if(e.target.name==='status'&&editing.kind==='task') { const progress=$('[name=progress]');if(e.target.value==='done')progress.value=100;else if(progress.value==='100')progress.value=0; }
    if(e.target.name==='color')updateSwatches(e.target.value);
  });
  function updateSwatches(color){document.querySelectorAll('[data-color]').forEach(b=>{b.classList.toggle('selected',b.dataset.color===color);b.setAttribute('aria-pressed',String(b.dataset.color===color));});}
  function deleteRecord(){
    const {kind,id,collection}=editing;
    if(kind==='member'&&data.tasks.some(t=>t.assigneeId===id)){notify('请先转移或删除该成员的任务，再删除成员');return;}
    if(kind==='project'&&(data.tasks.some(t=>t.projectId===id)||data.milestones.some(m=>m.projectId===id))){notify('请先转移或删除项目中的任务与里程碑');return;}
    ask('删除这条记录？',kind==='task'?'任务将被删除，关联里程碑将保留为项目级里程碑。':'删除后无法直接撤销，已有导出备份不受影响。',()=>{commit(d=>{d[collection]=d[collection].filter(x=>x.id!==id);if(kind==='task')d.milestones.forEach(m=>{if(m.taskId===id)m.taskId='';});});if(prefs.project===id)prefs.project='';if(prefs.member===id)prefs.member='';if(prefs.me===id)prefs.me=data.members[0]?.id||'';$('#editor').close();render();});
  }
  function toggleTask(id){commit(d=>{const t=d.tasks.find(t=>t.id===id);if(!t)return;const done=t.status==='done';t.status=done?'todo':'done';t.progress=done?0:100;t.completedAt=done?null:today;},'任务状态已更新');}
  function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  async function saveJSON(){
    const content=JSON.stringify(data,null,2),name=`Wiz-团队日程-${today}.json`;
    if(window.showSaveFilePicker){try{const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'JSON 数据备份',accept:{'application/json':['.json']}}]});const writer=await handle.createWritable();await writer.write(content);await writer.close();notify('JSON 备份已写入所选文件');return;}catch(e){if(e.name==='AbortError')return;}}
    download(content,'application/json',name);notify('已发起 JSON 下载，请在下载目录确认');
  }
  function saveHTML(){
    const snapshot=structuredClone(data);snapshot.workspaceId=uid();
    const clone=document.documentElement.cloneNode(true);
    clone.querySelector('#planner-data').textContent=JSON.stringify(snapshot).replace(/</g,'\\u003c');
    clone.querySelectorAll('dialog').forEach(d=>d.removeAttribute('open'));clone.querySelector('#toast').classList.remove('show');
    clone.querySelector('#storage-warning').hidden=true;clone.querySelector('body').classList.remove('sidebar-hidden');
    download('<!doctype html>\n'+clone.outerHTML,'text/html',`Wiz-团队日程-${today}.html`);notify('已发起 HTML 下载，文件包含当前全部数据');
  }
  function adopt(incoming){
    const checked=validateData(incoming);checked.workspaceId=uid();data=checked;
    // Keep the file's workspace identity stable: its cache points at the imported data.
    key=`wiz-planner:${embedded?.workspaceId||'wiz-local-v1'}`;
    storageBlocked=false;prefs.project='';prefs.member='';prefs.me=data.members[0]?.id||'';prefs.search='';$('#search').value='';persist();render();$('#backup-dialog').close();if(!saveError)notify('工作区已恢复');
  }
  $('#import-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{if(file.size>20*1024*1024)throw new Error('文件过大，请使用 20 MB 以内的 JSON 备份');const incoming=validateData(JSON.parse(await file.text()));ask('恢复这份备份？',`包含 ${incoming.projects.length} 个项目、${incoming.members.length} 位成员、${incoming.tasks.length} 项任务和 ${incoming.milestones.length} 个里程碑。将替换当前工作区；建议先导出当前数据。`,()=>adopt(incoming));}catch(err){notify('未导入：'+err.message);}finally{e.target.value='';}
  });
  async function importLegacy(){try{if(location.protocol==='file:')throw new Error('请通过 start.bat 启动后，再使用此功能');const names=['projects','members','tasks','milestones'];const results=await Promise.all(names.map(async n=>{const res=await fetch('/api/'+n);if(!res.ok)throw new Error('原版 API 不可用');return res.json();}));const incoming=convertLegacy(Object.fromEntries(names.map((n,i)=>[n,results[i]])));ask('导入原版数据？',`读取到 ${incoming.tasks.length} 项任务、${incoming.members.length} 位成员。将替换当前离线工作区；原版数据库保持不变。旧优先级 urgent/high 转为 P0，medium 为 P1，low 为 P2。`,()=>adopt(incoming));}catch(e){notify(e.message);}}
  const actions={
    'new-task':()=>openEditor('task'),'new-member':()=>openEditor('member'),'new-project':()=>openEditor('project'),'new-milestone':()=>openEditor('milestone'),
    'close-editor':()=>$('#editor').close(),'delete-record':deleteRecord,'backup':()=>$('#backup-dialog').showModal(),'close-backup':()=>$('#backup-dialog').close(),
    'save-json':saveJSON,'save-html':saveHTML,'import-json':()=>$('#import-file').click(),'legacy-import':importLegacy,
    'empty-workspace':()=>ask('创建空白工作区？','当前工作区会被空白数据替换。请先导出备份，之后可随时导入恢复。',()=>adopt({version:1,workspaceId:uid(),name:'我的团队空间',projects:[],members:[],tasks:[],milestones:[]})),
    'theme':()=>{prefs.theme=prefs.theme==='light'?'dark':'light';render();},'sidebar':()=>document.body.classList.toggle('sidebar-hidden'),
    'clear-filters':()=>{prefs.project='';prefs.member='';prefs.priority='';prefs.status='';prefs.search='';$('#search').value='';render();},
    'go-today':()=>{today=dateKey();anchor=addDays(today,-2);month=today.slice(0,7)+'-01';render();},
    'prev':()=>navigate(-1),'next':()=>navigate(1)
  };
  function navigate(direction){if(prefs.view==='calendar'){const d=parseDay(month);d.setMonth(d.getMonth()+direction);month=dateKey(d);}else anchor=addDays(anchor,direction*prefs.days);render();}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.dragTask&&Date.now()<suppressClickUntil)return;
    if(b.dataset.action){actions[b.dataset.action]?.();return;}
    if(b.dataset.view){prefs.view=b.dataset.view;render();return;}
    if(b.hasAttribute('data-project')){prefs.project=b.dataset.project;render();return;}
    if(b.dataset.member){if(prefs.view==='today'){prefs.me=b.dataset.member;prefs.member='';}else prefs.member=prefs.member===b.dataset.member?'':b.dataset.member;render();return;}
    if(b.dataset.editTask)openEditor('task',b.dataset.editTask);
    if(b.dataset.editMember)openEditor('member',b.dataset.editMember);
    if(b.dataset.editProject)openEditor('project',b.dataset.editProject);
    if(b.dataset.editMilestone)openEditor('milestone',b.dataset.editMilestone);
    if(b.dataset.toggleTask)toggleTask(b.dataset.toggleTask);
    if(b.dataset.newFor)openEditor('task','',{assigneeId:b.dataset.newFor,color:member(b.dataset.newFor).color});
    if(b.dataset.newDate)openEditor('task','',{startDate:b.dataset.newDate,endDate:b.dataset.newDate,deadline:b.dataset.newDate});
    if(b.dataset.jumpTask){anchor=addDays(data.tasks.find(t=>t.id===b.dataset.jumpTask).startDate,-2);render();}
    if(b.dataset.color){$('[name=color]').value=b.dataset.color;updateSwatches(b.dataset.color);}
  });
  $('#search').addEventListener('input',e=>{prefs.search=e.target.value;render();});
  $('#priority-filter').addEventListener('change',e=>{prefs.priority=e.target.value;render();});
  $('#status-filter').addEventListener('change',e=>{prefs.status=e.target.value;render();});
  $('#my-member').addEventListener('change',e=>{prefs.me=e.target.value;render();});
  $('#view-toolbar').addEventListener('change',e=>{if(e.target.id==='range-select'){prefs.days=Number(e.target.value);render();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){drag.button.style.transform='';drag=null;}if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveJSON();}});
  document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-drag-task]');if(!b||e.button!==0)return;drag={button:b,id:b.dataset.dragTask,x:e.clientX,step:b.parentElement.clientWidth/prefs.days,delta:0};});
  document.addEventListener('pointermove',e=>{if(!drag)return;drag.delta=Math.round((e.clientX-drag.x)/drag.step);drag.button.style.transform=`translateX(${drag.delta*drag.step}px)`;});
  document.addEventListener('pointerup',()=>{if(!drag)return;const {id,delta,button}=drag;drag=null;button.style.transform='';if(!delta)return;suppressClickUntil=Date.now()+400;commit(d=>{const t=d.tasks.find(t=>t.id===id);t.startDate=addDays(t.startDate,delta);t.endDate=addDays(t.endDate,delta);},`计划已${delta>0?'推迟':'提前'} ${Math.abs(delta)} 天，Deadline 保持不变`);});
  document.addEventListener('pointercancel',()=>{if(drag)drag.button.style.transform='';drag=null;});
  window.addEventListener('blur',()=>{if(drag)drag.button.style.transform='';drag=null;});
  window.addEventListener('storage',e=>{if(e.key===key){storageBlocked=true;$('#storage-warning').hidden=false;$('#storage-warning').textContent='另一个窗口修改了此工作区。为避免相互覆盖，当前窗口已暂停自动保存；请先导出需要保留的修改，再刷新。';render();}});
  window.addEventListener('beforeunload',e=>{if(saveError){e.preventDefault();e.returnValue='';}});
  setInterval(()=>{if(today!==dateKey()){today=dateKey();render();}},30000);
  render();
  if(!storageBlocked)persist();
})();
