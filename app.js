const $=s=>document.querySelector(s),key=g=>g?`${g.sessionID}:${g.localID}`:null;let pages,by,current,trail=[],timers=[],customTime='',draft='',store=JSON.parse(localStorage.getItem('wanna-inputs')||'{}');
function rgba(c,opacity=1){return c?`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${(c.a??1)*opacity})`:'transparent'}
function paint(p){if(!p)return 'transparent';if(p.type==='SOLID')return rgba(p.color,p.opacity??1);if(p.type==='IMAGE')return `url("assets/${p.image.hash.map(x=>x.toString(16).padStart(2,'0')).join('')}")`;if(p.stops)return `${p.type==='GRADIENT_RADIAL'?'radial-gradient(ellipse at center':'linear-gradient(180deg'},${p.stops.map(s=>`${rgba(s.color,p.opacity??1)} ${s.position*100}%`).join(',')})`;return 'transparent'}
function notice(s){$('#toast').textContent=s;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2600)}
function acts(n){return (n.prototypeInteractions||[]).filter(i=>!i.isDeleted)}
function textOf(n){return [n.text||'',...n.children.map(textOf)].join(' ')}
function level(id){
 const n=by.get(id)?.name||'';
 if(['61:572','61:608','61:963'].includes(id))return 'tab:'+id;
 if(/参与确认|自定时间确认/.test(n))return /巨星|登台/.test(n)?'star-confirm':'street-confirm';
 if(/参与行动|行动安排|自定时间行动/.test(n))return /巨星|登台/.test(n)?'star-action':'street-action';
 if(/自行填写时间|时间输入中/.test(n))return 'time-form';
 if(/小wan聊聊|愿望回响|备用结果/.test(n))return /巨星/.test(n)?'star-result':'street-result';
 if(/设置/.test(n))return 'settings';
 if(/加载光点|正在连接愿望/.test(n))return 'loading';
 return id;
}
function go(id,replace=false){
 if(!by.has(id)){notice('此处为组件状态');return}
 const group=level(id),old=current&&level(current);
 if(group.startsWith('tab:'))trail=[];
 else if(current&&id!==current&&!replace&&group!==old){
  const at=trail.findIndex(x=>level(x)===group);
  if(at>=0)trail=trail.slice(0,at);
  else trail.push(current);
 }
 current=id;render();history.replaceState(null,'','#'+id)
}
function back(){const group=level(current);while(trail.length&&level(trail.at(-1))===group)trail.pop();go(trail.pop()||'61:572',true)}
function action(a,n){
 if(a.navigationType==='SWAP_STATE'){
  const el=document.querySelector(`[data-id="${n.id}"]`);if(el){el.style.filter=el.dataset.active?'':'brightness(1.25)';el.dataset.active=el.dataset.active?'':'1'}
  if(/Vote/.test(n.name)){const count=Number(localStorage.getItem('wanna-votes')||12);if(count>0){localStorage.setItem('wanna-votes',count-1);notice(`愿望券已投出，剩余 ${count-1} 张`)}else notice('演示愿望券已用完')}
  else notice('已切换状态 · 本地演示');return
 }
 if(a.navigationType==='BACK'||a.connectionType==='BACK'){back();return}let id=key(a.transitionNodeID);if(id){if(!by.has(id)){if(id==='61:534'){go('61:711');return}notice('已记录你的共鸣');return}const realInputs={'247:937':'246:1008','247:973':'246:1177','247:1009':'246:1344'};if(realInputs[id]&&current!==id){const f=document.querySelector('#screen input');if(f){f.focus();return}}const label=n.name||'';if(/返回|Back/i.test(label)){back();return}const state=/^(State|交互状态)/.test(by.get(id)?.name||'');go(id,state||a.navigationType==='SWAP'||a.navigationType==='CHANGE_TO');return}notice('已记录 · 本地演示')}
function node(n,root=false,override=[]){if(n.visible===false)return null;n={...n};const ov=override.find(o=>key(o.guidPath?.guids?.at(-1))===n.id);if(ov)n={...n,...ov,text:ov.textData?.characters??n.text};const el=document.createElement('div');el.className='node';el.dataset.id=n.id;el.dataset.iconName=n.name||'';const s=el.style,w=n.size?.x||0,h=n.size?.y||0,t=n.transform||{};Object.assign(s,{width:w+'px',height:h+'px',opacity:n.opacity??1,borderRadius:(n.cornerRadius||0)+'px'});if(!root)s.transform=`matrix(${t.m00??1},${t.m10||0},${t.m01||0},${t.m11??1},${t.m02||0},${t.m12||0})`;if(n.rectangleTopLeftCornerRadius!==undefined&&[n.rectangleTopLeftCornerRadius,n.rectangleTopRightCornerRadius,n.rectangleBottomRightCornerRadius,n.rectangleBottomLeftCornerRadius].some(v=>v>0))s.borderRadius=[n.rectangleTopLeftCornerRadius,n.rectangleTopRightCornerRadius,n.rectangleBottomRightCornerRadius,n.rectangleBottomLeftCornerRadius].map(v=>(v??n.cornerRadius??0)+'px').join(' ');
const shadow=(n.effects||[]).filter(e=>e.visible!==false&&['DROP_SHADOW','INNER_SHADOW'].includes(e.type));if(shadow.length)s.boxShadow=shadow.map(e=>`${e.type==='INNER_SHADOW'?'inset ':''}${e.offset?.x||0}px ${e.offset?.y||0}px ${e.radius||0}px ${e.spread||0}px ${rgba(e.color)}`).join(',');
const fills=(n.fillPaints||[]).filter(p=>p.visible!==false);if(fills.length){s.background=fills.slice().reverse().map(paint).join(',');s.backgroundSize='cover';s.backgroundPosition='center'}const stroke=n.strokePaints?.find(p=>p.visible!==false);if(stroke)s.boxShadow=[s.boxShadow,`inset 0 0 0 ${n.strokeWeight||1}px ${rgba(stroke.color)}`].filter(Boolean).join(',');if(n.type==='FRAME'&&n.cornerRadius>0)s.isolation='isolate';if(n.type==='ELLIPSE')s.borderRadius='50%';if(n.type==='FRAME'&&!n.frameMaskDisabled)s.overflow='hidden';if(n.name&&/scroll|滚动/i.test(n.name)){s.overflowY='auto';s.overflowX='hidden';s.scrollbarWidth='none'}
if(n.paths?.length){s.background='none';s.boxShadow='none';const color=fills.find(p=>p.type==='SOLID')?.color;el.innerHTML=`<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="overflow:visible">${n.paths.map(p=>`<path d="${p}" fill="${color?rgba(color):stroke?rgba(stroke.color):fills.length?'#f7dfa4':'none'}" stroke="none" stroke-width="${n.strokeWeight||1}"/>`).join('')}</svg>`}
if(n.type==='TEXT'){el.classList.add('text');s.background='none';s.boxShadow='none';s.color=rgba(fills[0]?.color||{r:1,g:1,b:1,a:1});s.fontSize=(n.fontSize||14)+'px';s.fontFamily='"Microsoft YaHei","PingFang SC",sans-serif';s.fontWeight=/bold/i.test(n.fontName?.style||'')?700:/medium/i.test(n.fontName?.style||'')?500:400;s.textAlign=(n.textAlignHorizontal||'LEFT').toLowerCase();s.lineHeight=n.lineHeight?.value>0&&n.lineHeight.units==='PIXELS'?n.lineHeight.value+'px':'1.45';let txt=n.text||'';if(customTime&&txt.includes('周二晚'))txt=txt.replace(/周二晚上?[^\n，。]*/g,customTime);el.textContent=txt;
const input=n.id==='61:674'||n.id==='222:845'||/验证码$/.test(txt)||/再告诉小wan/.test(txt)||/请输入|填写你|输入你|写下你|输入手机号|输入验证码/.test(txt)||(/Flow \/ 自行填写/.test(by.get(current)?.name||'')&&/日期|时间段/.test(txt)&&w>200&&h>30);if(input&&h>=18){const entry=document.createElement(h>50?'textarea':'input');entry.className='entry';entry.setAttribute('aria-label',txt);entry.placeholder=txt;entry.value=store[n.id]||((n.id==='61:674'||n.id==='222:845')?txt:'');if(/手机/.test(txt))entry.inputMode='tel';if(/验证码/.test(txt))entry.inputMode='numeric';entry.maxLength=n.id==='61:674'?300:500;entry.oninput=()=>{store[n.id]=entry.value;localStorage.setItem('wanna-inputs',JSON.stringify(store));if(/时间|日期/.test(txt))customTime=entry.value;else draft=entry.value};entry.onclick=e=>e.stopPropagation();el.replaceChildren(entry)}}
let kids=n.children;if(n.symbolSize&&w&&h){const wrap=document.createElement('div');Object.assign(wrap.style,{position:'absolute',width:n.symbolSize.x+'px',height:n.symbolSize.y+'px',transformOrigin:'0 0',transform:`scale(${w/n.symbolSize.x},${h/n.symbolSize.y})`});kids.forEach(c=>{const child=node(c,false,n.overrides||[]);if(child)wrap.append(child)});el.append(wrap)}else kids.forEach(c=>{const child=node(c,false,override);if(child)el.append(child)});
const interactions=acts(n),click=interactions.find(i=>i.event?.interactionType==='ON_CLICK');if(click){el.classList.add('hit');el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',textOf(n).trim()||n.name);const run=e=>{e.stopPropagation();const label=textOf(n);if(/获取验证码/.test(label)){notice('演示验证码：123456');return}if(/点击填写.*时间/.test(label))return;if(/保存时间/.test(label)){const f=document.querySelector('#screen input,#screen textarea');if(!f?.value?.trim()){notice('请先填写方便的时间');f?.focus();return}customTime=f.value.trim();localStorage.setItem('wanna-time',customTime);const target={'246:1008':'246:869','246:1177':'246:1038','246:1344':'246:1207','247:937':'246:869','247:973':'246:1038','247:1009':'246:1207'}[current];if(target){go(target,true);return}}click.actions?.forEach(a=>action(a,n))};el.onclick=run;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run(e)}}}for(const i of interactions)if(['AFTER_TIMEOUT','AFTER_DELAY'].includes(i.event?.interactionType))timers.push(setTimeout(()=>i.actions?.forEach(a=>action(a,n)),Math.max(350,(i.event.timeout||i.event.delay||.7)*1000)));
return el}
function fit(){const vp=$('#viewport');let scale=Math.min(vp.clientWidth/393,vp.clientHeight/852);$('#screen').style.transform=`scale(${scale})`;$('#screen').style.left=(vp.clientWidth-393*scale)/2+'px'}
function render(){timers.forEach(clearTimeout);timers=[];const page=by.get(current);$('#screen').replaceChildren(node(page,true));$('#pages').value=current;document.title=page.name+' · Wanna';fit();enhance();repairIcons();refineComponents();finishIcons();if(current==='246:823')timers.push(setTimeout(()=>go('246:842',true),900));if(current==='246:842')timers.push(setTimeout(()=>go('61:572',true),900))}
Promise.resolve(window.WANNA_DESIGN).then(data=>{pages=data;by=new Map(data.map(p=>[p.id,p]));$('#pages').innerHTML=data.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');$('#pages').onchange=e=>go(e.target.value);$('#home').onclick=()=>go('61:572');$('#login').onclick=()=>go('246:790');go(by.has(location.hash.slice(1))?location.hash.slice(1):'246:790',true);window.onresize=fit}).catch(()=>notice('加载失败，请通过本地 HTTP 服务打开'));

function enhance(){
 const page=by.get(current),name=page.name;
 if(/上传老街作品/.test(name)){
  const upload=document.createElement('input');upload.type='file';upload.accept='image/*';upload.multiple=true;upload.setAttribute('aria-label','选择老街照片');Object.assign(upload.style,{position:'absolute',left:'24px',top:'445px',width:'345px',fontSize:'12px',color:'#c4eeea'});upload.onchange=()=>{const files=[...upload.files].slice(0,3);notice(`已选择 ${files.length} 张照片，仅保存在本次演示中`);const imgs=[...document.querySelectorAll('#screen .node')].filter(e=>e.style.background.includes('url(')&&parseFloat(e.style.width)>60&&parseFloat(e.style.width)<180);files.forEach((f,i)=>{if(imgs[i])imgs[i].style.backgroundImage=`url('${URL.createObjectURL(f)}')`})};$('#screen').append(upload);
 }
 if(/与小wan聊聊|小wan聊聊/.test(name)){
  const input=$('#screen input');if(input){input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim()){e.stopPropagation();notice('小wan（预设回复）：记住啦，你可以按舒服的方式参与。点击确认，查看关联愿望。');input.value=''}})}
 }
}
const iconPaths={back:'M15 5 8 12l7 7',arrow:'M4 12h16m-6-6 6 6-6 6',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',comment:'M4 4h16v12H9l-5 4Z',bookmark:'M6 3h12v18l-6-4-6 4Z',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M16 8l-3 5-5 3 3-5Z',user:'M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M3 22v-2a9 9 0 0 1 18 0v2',camera:'M3 6h4l2-3h6l2 3h4v15H3Z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',mic:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0Z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v4m-4 0h8',share:'M12 16V2m-5 5 5-5 5 5 M5 11H2v11h20V11h-3',grid:'M3 3h7v7H3Z M14 3h7v7h-7Z M3 14h7v7H3Z M14 14h7v7h-7Z'};
Object.assign(iconPaths,{ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z M9 5v3m0 3v2m0 3v3',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z'});
function repairIcons(){document.querySelectorAll('#screen .node').forEach(el=>{const name=el.dataset.iconName;if(!name)return;const type=name.split('/').at(-1).trim();if(iconPaths[type]){el.style.overflow='visible';el.style.boxShadow='none';el.style.background='none';el.innerHTML=`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[type]}"/></svg>`}if(name==='Wanna Night / Status bar'){el.innerHTML='<span style="position:absolute;left:28px;top:17px;font-size:14px;font-weight:600">9:41</span><span style="position:absolute;right:28px;top:19px;display:flex;gap:6px;align-items:center"><svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M0 8h3v4H0zm5-4h3v8H5zm5-4h3v12h-3z"/></svg><svg width="17" height="13" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 5Q12-3 22 5M6 10q6-5 12 0M10 14q2-2 4 0"/></svg><svg width="24" height="12" viewBox="0 0 26 13" fill="none" stroke="currentColor"><rect x="1" y="1" width="21" height="11" rx="3"/><path d="M24 4v5"/><rect x="3" y="3" width="17" height="7" rx="1" fill="currentColor"/></svg></span>'}})}

function refineComponents(){
 const all=[];function collect(n){all.push(n);n.children.forEach(collect)}collect(by.get(current));
 function imagePaint(n){for(const p of n.fillPaints||[])if(p.type==='IMAGE')return p;for(const c of n.children){const found=imagePaint(c);if(found)return found}}
 const dark='#185b64',muted='#659196';
 for(const el of [...document.querySelectorAll('#screen .node')]){
  const n=all.find(n=>n.id===el.dataset.id&&n.name===el.dataset.iconName);if(!n)continue;
  if(n.type==='INSTANCE'&&/Wanna \/ 小wan/.test(n.name)){
   const img=imagePaint(n);if(img){el.replaceChildren();el.style.background=paint(img)+' center / contain no-repeat';el.style.overflow='visible'}
  }
  if(n.type==='INSTANCE'&&/Wanna Night \/ Button/.test(n.name)){
   const label=n.children.find(c=>c.type==='TEXT')?.text||'继续';
   el.replaceChildren();Object.assign(el.style,{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 22px',gap:'12px',color:dark,fontSize:'15px',fontWeight:'500',overflow:'hidden'});
   const t=document.createElement('span');t.textContent=label;t.style.whiteSpace='nowrap';const arrow=document.createElement('span');arrow.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';arrow.style.flexShrink='0';el.append(t,arrow);
  }
  if(n.name.startsWith('Icon /')){
   let color=dark;
   const parent=el.parentElement;const sibling=parent&&[...parent.children].find(c=>c.classList.contains('text'));
   if(sibling)color=sibling.style.color||dark;
   else {const vector=n.children.flatMap(c=>[c,...c.children]).find(c=>c.fillPaints?.some(p=>p.type==='SOLID')||c.strokePaints?.some(p=>p.type==='SOLID'));const ink=vector?.fillPaints?.find(p=>p.type==='SOLID')||vector?.strokePaints?.find(p=>p.type==='SOLID');if(ink)color=rgba(ink.color)}
   if(/back/.test(n.name))color='#e3f3f0';
   el.style.color=color;
  }
  if(n.type==='INSTANCE'&&/许愿瓶/.test(n.name)){
   el.innerHTML='<svg width="100%" height="100%" viewBox="0 0 120 160" fill="none"><path d="M48 12h24v12H48z" fill="#e2c17e"/><path d="M45 25h30v17c0 9 13 13 13 26v60c0 15-56 15-56 0V68c0-13 13-17 13-26V25Z" fill="#65bec6" fill-opacity=".85" stroke="#a4e7e2" stroke-width="2"/><path d="M43 67v42" stroke="#c9f4e9" stroke-width="3" stroke-linecap="round"/><rect x="41" y="79" width="38" height="42" rx="5" fill="#fff9df"/><path d="m60 87 3.3 6.8 7.5 1.1-5.4 5.3 1.3 7.5-6.7-3.5-6.7 3.5 1.3-7.5-5.4-5.3 7.5-1.1Z" fill="#e7ca7b"/></svg>';el.style.background='none';el.style.boxShadow='none';el.style.overflow='visible';
  }
 }
 const status=document.querySelector('[data-icon-name="Wanna Night / Status bar"]');if(status){const light=current==='61:963'||/欢迎与登录|验证码|愿望盲盒|Demo A/.test(by.get(current).name);status.style.color=light?'#185b64':'#edf9f7'}
 // Navigation uses one consistent palette, with only the current tab emphasized.
 for(const nav of document.querySelectorAll('[data-icon-name="Wanna / Navigation"],[data-icon-name="Wanna Night / Tab bar"]')){
  const active=current==='61:963'?'user':/发现|Discovery|Demo B/.test(by.get(current).name)?'compass':'spark';
  nav.querySelectorAll('[data-icon-name^="Icon /"]').forEach(el=>{const selected=el.dataset.iconName.endsWith(active);el.style.color=selected?'#087f89':muted;el.style.opacity='1'});
 }
}

function finishIcons(){
 const shapes={
  ticket:'<path d="M5 4h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 1 2-2Z"/><path d="m12 7 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5Z" fill="currentColor" stroke-width=".7"/>',
  settings:'<path d="m9.5 3-.6 2.3-2 .9-2.1-.7-2.3 4 1.6 1.7v2l-1.6 1.7 2.3 4 2.1-.7 2 .9.6 2.3h5l.6-2.3 2-.9 2.1.7 2.3-4-1.6-1.7v-2l1.6-1.7-2.3-4-2.1.7-2-.9L14.5 3Z"/><circle cx="12" cy="12" r="3"/>',
  trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0V3Z M7 5H3v3a4 4 0 0 0 5 4 M17 5h4v3a4 4 0 0 1-5 4 M12 14v6m-4 1h8"/>',
  heart:'<path d="M20.3 5.3a5 5 0 0 0-7.1 0L12 6.5l-1.2-1.2a5 5 0 0 0-7.1 7.1L12 21l8.3-8.6a5 5 0 0 0 0-7.1Z"/>',
  comment:'<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h7"/>'
 };
 for(const el of document.querySelectorAll('#screen [data-icon-name]')){
  const name=el.dataset.iconName;let type=null;
  if(/愿望券符号|愿望券矢量/.test(name))type='ticket';
  else if(name==='Icon / settings')type='settings';
  else if(/榜单奖杯/.test(name))type='trophy';
  else if(name==='Icon / heart')type='heart';
  else if(name==='Icon / comment')type='comment';
  if(!type)continue;
  el.replaceChildren();Object.assign(el.style,{background:'none',boxShadow:'none',overflow:'visible',display:'flex',alignItems:'center',justifyContent:'center'});
  el.innerHTML=`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex-shrink:0">${shapes[type]}</svg>`;
  el.style.color=type==='ticket'?'#775c26':type==='trophy'?'#f5dfa0':'#397d7d';
  if(type==='trophy'){el.style.width='18px';el.style.height='18px'}
  if(type==='heart'||type==='comment'){
   el.style.width='16px';el.style.height='16px';
   const frame=el.parentElement;
   // Align both icon and number within their original card coordinates.
   const text=[...frame.children].filter(c=>c.classList.contains('text'));
   const matrix=new DOMMatrix(el.style.transform);const numeric=text.find(c=>{const m=new DOMMatrix(c.style.transform);return /^\d+$/.test(c.textContent.trim())&&Math.abs(m.m42-matrix.m42)<12&&m.m41>matrix.m41&&m.m41-matrix.m41<42});
   if(numeric){const m=new DOMMatrix(numeric.style.transform);m.m42=matrix.m42-1;numeric.style.transform=m.toString();numeric.style.fontSize='12px';numeric.style.lineHeight='18px';numeric.style.color='#397d7d'}
  }
 }
}
