const profile = {
  name: 'Nisa', sex: 'Female', age: 35, maritalStatus: 'Widowed', children: 1, childAge: 3,
  monthlyIncome: 60000, monthlyExpense: 40000, neededCoverage: 5000000,
  horizon: 19, educationStartAge: 7, annualEducationCostToday: 50000, inflation: 0.03, discount: 0.05,
  incomeGrowth: 0.03, heldAccidentCover: 1200000
};

// Values marked "illustrative" are scenario inputs, not insurer-provided quotes.
const policies = [
  {id:'paylink', short:'20 Pay Link', name:'AIA 20 Pay Link', type:'Unit linked / 20-pay', insured:'Mother', premium:10000, paymentYears:20, cover:5000000, fund19:2350000, returnRate:0.045, protection:100, premiumScore:57, education:100, flexibility:78, value:68, color:'#4E79A7', fact:'Limited-pay unit-linked policy; protection to age 99 with a retirement bonus feature.'},
  {id:'wealthmax', short:'Wealth Max', name:'AIA Wealth Max', type:'Unit linked / limited pay', insured:'Mother', premium:7500, paymentYears:15, cover:5000000, fund19:2110000, returnRate:0.043, protection:100, premiumScore:71, education:97, flexibility:72, value:75, color:'#F28E2B', fact:'Limited-pay unit-linked policy designed for long-term saving, with bonus features subject to policy conditions.'},
  {id:'gift', short:'Infinite Gift', name:'AIA Infinite Gift Prestige', type:'Unit linked / child plan', insured:'Child', premium:6500, paymentYears:15, cover:0, fund19:1860000, returnRate:0.042, protection:0, premiumScore:84, education:96, flexibility:76, value:78, color:'#E15759', fact:'Child-focused unit-linked plan, available for insured children. It builds education capital but does not protect the mother\'s life need.'},
  {id:'issara', short:'Issara Plus', name:'AIA Issara Plus', type:'Unit linked / regular pay', insured:'Mother', premium:5500, paymentYears:19, cover:5000000, fund19:1810000, returnRate:0.040, protection:100, premiumScore:81, education:89, flexibility:96, value:64, color:'#76B7B2', fact:'Regular-premium unit-linked plan with flexible premium and investment options; charges are funded from policy value.'},
  {id:'smart', short:'Smart Select', name:'AIA Smart Select Prestige', type:'Unit linked / prestige', insured:'Mother', premium:25000, paymentYears:19, cover:10000000, fund19:6290000, returnRate:0.046, protection:100, premiumScore:0, education:100, flexibility:88, value:70, color:'#B07AA1', fact:'Prestige unit-linked plan with minimum THB 10M cover. It is materially above this household\'s free-cash-flow capacity.'}
].map(p => ({...p, premiumBurden: p.premium / (profile.monthlyIncome - profile.monthlyExpense) * 100,
  overall: Math.round(p.protection*.30 + p.premiumScore*.25 + p.education*.20 + p.flexibility*.15 + p.value*.10)}));

const money = n => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(Math.round(n));
const compact = n => n === 0 ? '0' : `THB ${(n/1000000).toFixed(n >= 1000000 ? 1 : 2)}M`;
const byId = id => policies.find(p => p.id === id);
let selectedId = 'wealthmax';
let brushedIds = new Set(policies.map(p => p.id));
let valueBasis = 'nominal';
const educationStartYear = profile.educationStartAge - profile.childAge;

function scenarioData(){
  const rows=[];
  for(let y=0;y<=profile.horizon;y++){
    const income=profile.monthlyIncome*12*Math.pow(1+profile.incomeGrowth,y);
    const living=profile.monthlyExpense*12*Math.pow(1+profile.inflation,y);
    const education = y>=educationStartYear ? profile.annualEducationCostToday*Math.pow(1+profile.inflation,y) : 0;
    const factor=Math.pow(1+profile.discount,y);
    rows.push({year:y, childAge:profile.childAge+y, income, living, education, free:income-living-education, pvIncome:income/factor, pvLiving:living/factor, pvEducation:education/factor, pvFree:(income-living-education)/factor});
  }
  return rows;
}
const projection=scenarioData();
const educationFuture=projection.reduce((s,d)=>s+d.education,0);
const educationPV=projection.reduce((s,d)=>s+d.pvEducation,0);
const educationStart=projection[educationStartYear];

function metricStrip(){
  document.querySelector('#scenarioMetrics').innerHTML = [
    ['Education costs, future value', compact(educationFuture), `From age ${profile.educationStartAge} to age ${profile.childAge+profile.horizon}`],
    ['Value in today\'s money', compact(educationPV), `Discounted at ${profile.discount*100}%`],
    ['Cash flow in first school year', `THB ${money(educationStart.free/12)}/mo`, educationStart.free>0?'Still positive after school cost':'Funding strain'],
    ['School cost today', `THB ${money(profile.annualEducationCostToday)}/yr`, 'THB 25,000 per semester']
  ].map(([label,value,note])=>`<div class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
}

function sparkleMarkup(score){
  const count=score>=80?3:score>=70?2:1;
  const positions=[[-43,-39,.8],[0,-61,1],[43,-39,.8]];
  return positions.slice(0,count).map(([x,y,size])=>`<path d="M0 -7 L2.3 -2.3 L7 0 L2.3 2.3 L0 7 L-2.3 2.3 L-7 0 L-2.3 -2.3 Z" transform="translate(${x} ${y}) scale(${size})" fill="#D62828"/>`).join('');
}

function faceSvg(p){
  const r=52, eye=2.1+p.protection*.028, browCurve=(p.premiumScore-50)*.12;
  const mouthCurve=(p.education-50)*.16, blushRadius=3+p.flexibility*.038, blushOpacity=.16+p.flexibility*.0084;
  return `<svg viewBox="0 0 160 145" aria-hidden="true"><g transform="translate(80,75)">
    ${sparkleMarkup(p.overall)}
    <circle r="${r}" fill="#ffce2d" stroke="#361c0b" stroke-width="1.6"/>
    <circle cx="-${r*.37}" cy="${r*.19}" r="${blushRadius}" fill="#FF9DA7" opacity="${blushOpacity}"/><circle cx="${r*.37}" cy="${r*.19}" r="${blushRadius}" fill="#FF9DA7" opacity="${blushOpacity}"/>
    <path d="M-${r*.52} -${r*.34} Q-${r*.35} ${-r*.34-browCurve} -${r*.17} -${r*.34} M${r*.17} -${r*.34} Q${r*.35} ${-r*.34-browCurve} ${r*.52} -${r*.34}" fill="none" stroke="#5A5652" stroke-width="2.25" stroke-linecap="round"/>
    <circle cx="-${r*.32}" cy="-${r*.07}" r="${eye}" fill="#3B3937"/><circle cx="${r*.32}" cy="-${r*.07}" r="${eye}" fill="#3B3937"/>
    <path d="M-${r*.31} ${r*.33} Q0 ${r*.33+mouthCurve} ${r*.31} ${r*.33}" fill="none" stroke="#3B3937" stroke-width="2.8" stroke-linecap="round"/>
  </g></svg>`;
}

function faces(){
  document.querySelector('#faceGrid').innerHTML=policies.map(p=>{
    const displayName=p.id==='gift'?'AIA Infinite Gift<br />Prestige':p.name;
    return `<article class="face-card ${p.id===selectedId?'selected':''} ${brushedIds.has(p.id)?'':'dim'}" data-policy="${p.id}" tabindex="0" aria-label="${p.name}, suitability score ${p.overall}">
      <div class="name">${displayName}</div><span class="mini-score">${p.overall}</span><div class="type"><i class="type-dot" style="background:${p.color}"></i>${p.type}</div>${faceSvg(p)}<div class="fit">${p.insured} insured</div></article>`;
  }).join('');
  document.querySelectorAll('.face-card').forEach(el=>{
    el.addEventListener('click',()=>setSelected(el.dataset.policy));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(el.dataset.policy)}});
    el.addEventListener('mouseenter',e=>showTooltip(e,byId(el.dataset.policy)));
    el.addEventListener('mousemove',moveTooltip); el.addEventListener('mouseleave',hideTooltip);
  });
}

function setSelected(id){selectedId=id; renderLinked();}
function renderLinked(){faces(); scatter(); radar(); coverageBars(); projectionChart(); netCashChart(); cashCallout();}
const svgEl=(tag,attrs={})=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e};
function sText(svg,x,y,text,cls='axis-text',anchor='start'){const t=svgEl('text',{x,y,class:cls,'text-anchor':anchor});t.textContent=text;svg.appendChild(t);return t}
function line(svg,x1,y1,x2,y2,cls='grid-line'){svg.appendChild(svgEl('line',{x1,y1,x2,y2,class:cls}));}
function scale(v,a,b,start,end){return start+(v-a)/(b-a)*(end-start)}

function scatter(){
  const svg=document.querySelector('#scatterChart');svg.innerHTML='';const W=620,H=355,m={l:47,r:23,t:20,b:45};const x0=m.l,x1=W-m.r,y0=H-m.b,y1=m.t;
  for(let n=0;n<=5;n++){const v=n*25,x=scale(v,0,130,x0,x1);line(svg,x,y1,x,y0);sText(svg,x,y0+17,`${v}%`,'axis-text','middle')}
  for(let n=0;n<=5;n++){const v=50+n*10,y=scale(v,50,100,y0,y1);line(svg,x0,y,x1,y);sText(svg,x0-8,y+3,String(v),'axis-text','end')}
  line(svg,x0,y0,x1,y0,'axis-line');line(svg,x0,y0,x0,y1,'axis-line');sText(svg,(x0+x1)/2,H-10,'premium / free cash flow','axis-text','middle');const yl=sText(svg,14,(y0+y1)/2,'suitability score','axis-text','middle');yl.setAttribute('transform',`rotate(-90 14 ${(y0+y1)/2})`);
  const usefulX=scale(30,0,130,x0,x1), usefulY=scale(75,50,100,y0,y1);svg.appendChild(svgEl('rect',{x:usefulX,y:y1,width:x1-usefulX,height:usefulY-y1,fill:'rgba(119,118,188,.10)'}));
  sText(svg,x1-4,y1+14,'preferred zone','axis-text','end');
  policies.forEach(p=>{const cx=scale(p.premiumBurden,0,130,x0,x1),cy=scale(p.overall,50,100,y0,y1);const c=svgEl('circle',{cx,cy,r:p.id===selectedId?9:7,fill:p.color,class:`dot ${brushedIds.has(p.id)?'':'dim'} ${p.id===selectedId?'selected':''}`,'data-policy':p.id});c.addEventListener('click',()=>setSelected(p.id));c.addEventListener('mouseenter',e=>showTooltip(e,p));c.addEventListener('mousemove',moveTooltip);c.addEventListener('mouseleave',hideTooltip);svg.appendChild(c);sText(svg,cx+10,cy-9,p.short,`policy-label ${p.id===selectedId?'selected':''}`)});
  let dragging=false,start=null,box=null;
  svg.onpointerdown=e=>{const pt=svgPoint(e,svg);if(pt.x<x0||pt.x>x1||pt.y<y1||pt.y>y0)return;dragging=true;start=pt;box=svgEl('rect',{class:'brush-box',x:pt.x,y:pt.y,width:0,height:0});svg.appendChild(box);svg.setPointerCapture(e.pointerId)};
  svg.onpointermove=e=>{if(!dragging)return;const p=svgPoint(e,svg),x=Math.max(x0,Math.min(x1,p.x)),y=Math.max(y1,Math.min(y0,p.y));box.setAttribute('x',Math.min(start.x,x));box.setAttribute('y',Math.min(start.y,y));box.setAttribute('width',Math.abs(x-start.x));box.setAttribute('height',Math.abs(y-start.y));};
  svg.onpointerup=e=>{if(!dragging)return;dragging=false;const x=+box.getAttribute('x'),y=+box.getAttribute('y'),w=+box.getAttribute('width'),h=+box.getAttribute('height');if(w<6||h<6){box.remove();return}brushedIds=new Set(policies.filter(p=>{const cx=scale(p.premiumBurden,0,130,x0,x1),cy=scale(p.overall,50,100,y0,y1);return cx>=x&&cx<=x+w&&cy>=y&&cy<=y+h}).map(p=>p.id));if(!brushedIds.size)brushedIds=new Set();faces();scatter();coverageBars();};
}
function svgPoint(e,svg){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*620,y:(e.clientY-r.top)/r.height*355}}

function radar(){
  const p=byId(selectedId),svg=document.querySelector('#radarChart');svg.innerHTML='';document.querySelector('#radarTitle').textContent=p.name;document.querySelector('#radarSubtitle').textContent=`${p.insured} insured - THB ${money(p.premium)}/month - illustrative`;document.querySelector('#overallBadge').textContent=p.overall;
  const W=470,H=355,cx=235,cy=180,R=113,keys=[['Protection fit','protection'],['Premium efficiency','premiumScore'],['Purpose alignment','education'],['Flexibility','flexibility'],['Value efficiency','value']];
  const pos=(i,v=1)=>{const a=-Math.PI/2+i*Math.PI*2/5;return[cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v]};
  [0.25,.5,.75,1].forEach(level=>{const pts=keys.map((_,i)=>pos(i,level).join(',')).join(' ');svg.appendChild(svgEl('polygon',{points:pts,class:'radar-grid'}))});
  keys.forEach(([label],i)=>{const [x,y]=pos(i);line(svg,cx,cy,x,y,'radar-axis');const [tx,ty]=pos(i,1.18);sText(svg,tx,ty,label,'axis-text',tx<cx-15?'end':tx>cx+15?'start':'middle')});
  const points=keys.map(([,key],i)=>pos(i,p[key]/100).join(',')).join(' ');svg.appendChild(svgEl('polygon',{points,class:'radar-shape'}));keys.forEach(([,key],i)=>{const[x,y]=pos(i,p[key]/100);svg.appendChild(svgEl('circle',{cx:x,cy:y,r:3.5,class:'radar-point'}));});
  sText(svg,cx,cy-7,'overall','axis-text','middle');const score=sText(svg,cx,cy+15,String(p.overall),'','middle');score.setAttribute('font-size','23');score.setAttribute('font-family','DM Mono');score.setAttribute('fill','#D62828');
}

function coverageBars(){
  const svg=document.querySelector('#coverageChart');svg.innerHTML='';const W=520,H=355,m={l:112,r:35,t:25,b:38},x0=m.l,x1=W-m.r,y0=H-m.b;const max=10000000;
  [0,2.5,5,7.5,10].forEach(v=>{const x=scale(v*1e6,0,max,x0,x1);line(svg,x,m.t,x,y0);sText(svg,x,y0+17,`${v}M`,'axis-text','middle')});line(svg,x0,y0,x1,y0,'axis-line');sText(svg,x1,y0+33,'sum assured, THB','axis-text','end');
  const needX=scale(profile.neededCoverage,0,max,x0,x1);line(svg,needX,m.t,needX,y0,'');svg.lastChild.setAttribute('stroke','#323157');svg.lastChild.setAttribute('stroke-dasharray','4 3');sText(svg,needX,m.t-7,'need 5M','axis-text','middle');
  policies.forEach((p,i)=>{const y=m.t+24+i*48,w=scale(p.cover,0,max,x0,x1)-x0;const rect=svgEl('rect',{x:x0,y,width:Math.max(2,w),height:23,fill:p.color,class:`bar ${brushedIds.has(p.id)?'':'dim'} ${p.id===selectedId?'selected':''}`,'data-policy':p.id});rect.addEventListener('click',()=>setSelected(p.id));rect.addEventListener('mouseenter',e=>showTooltip(e,p));rect.addEventListener('mousemove',moveTooltip);rect.addEventListener('mouseleave',hideTooltip);svg.appendChild(rect);sText(svg,x0-8,y+16,p.short,'axis-text','end');sText(svg,Math.max(x0+5,x0+w+7),y+16,p.cover?`${(p.cover/1e6).toFixed(0)}M`:'Child insured','policy-label')});
}

function projectionRows(basis=valueBasis){
  const selected=byId(selectedId);
  return projection.map(d=>{
    const divisor=basis==='pv'?Math.pow(1+profile.discount,d.year):1;
    const income=basis==='pv'?d.pvIncome:d.income;
    const living=basis==='pv'?d.pvLiving:d.living;
    const education=basis==='pv'?d.pvEducation:d.education;
    const policyPremium=d.year<selected.paymentYears?selected.premium*12/divisor:0;
    return {...d,income,living,education,policyPremium,totalExpense:living+education+policyPremium,free:income-living-education-policyPremium};
  });
}

function projectionTooltip(e,d){
  showTooltip(e,{name:`Year ${d.year} / child age ${d.childAge}`,custom:`Income: THB ${money(d.income)}<br>Living costs: THB ${money(d.living)}<br>Policy premium: THB ${money(d.policyPremium)}<br>Education: THB ${money(d.education)}<br><span class="tip-score">Money left: THB ${money(d.free)}</span>`});
}

function projectionChart(){
  const svg=document.querySelector('#projectionChart');svg.innerHTML='';const W=920,H=276,m={l:58,r:20,t:26,b:32},x0=m.l,x1=W-m.r,y0=H-m.b,y1=m.t,data=projectionRows();
  const selected=byId(selectedId),max=Math.ceil(Math.max(...data.map(d=>d.income))/200000)*200000,sx=y=>scale(y,0,profile.horizon,x0,x1),sy=v=>scale(v,0,max,y0,y1);
  document.querySelector('#projectionDetail').textContent=`Includes ${selected.name} premium for ${selected.paymentYears} years; education starts when the child is ${profile.educationStartAge}.`;
  for(let n=0;n<=4;n++){const v=max*n/4,y=sy(v);line(svg,x0,y,x1,y);sText(svg,x0-8,y+3,`${(v/1e6).toFixed(1)}M`,'axis-text','end')}
  [0,5,10,15,19].forEach(year=>{const x=sx(year);line(svg,x,y0,x,y1);sText(svg,x,y0+18,`Yr ${year}`,'axis-text','middle')});line(svg,x0,y0,x1,y0,'axis-line');line(svg,x0,y0,x0,y1,'axis-line');
  const path=(field,close=false)=>{let d=`M ${sx(0)} ${sy(data[0][field])}`;data.slice(1).forEach(row=>d+=` L ${sx(row.year)} ${sy(row[field])}`);return close?`${d} L ${sx(profile.horizon)} ${y0} L ${sx(0)} ${y0} Z`:d};
  ['income','totalExpense','education'].forEach(key=>svg.appendChild(svgEl('path',{d:path(key),class:`line-${key==='totalExpense'?'expense':key}`})));
  const schoolStartX=sx(educationStartYear);svg.appendChild(svgEl('rect',{x:schoolStartX,y:y1,width:x1-schoolStartX,height:y0-y1,fill:'rgba(216,215,242,.38)'}));sText(svg,schoolStartX+6,y1+31,'education begins','annotation');
  [['Income','#5854D7'],['All planned outgoings','#D62828'],['Education','#5A5652']].forEach(([label,color],i)=>{const x=x0+10+i*150;svg.appendChild(svgEl('rect',{x,y:y1+5,width:9,height:9,fill:color}));sText(svg,x+14,y1+14,label,'legend')});
  const guide=svgEl('line',{x1:x0,y1:y1,x2:x0,y2:y0,stroke:'#D62828','stroke-width':1,'stroke-dasharray':'3 3',opacity:0});svg.appendChild(guide);
  const hover=svgEl('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'rgba(0,0,0,0)'});svg.appendChild(hover);
  hover.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),ratio=(((e.clientX-r.left)/r.width)*W-x0)/(x1-x0),year=Math.max(0,Math.min(profile.horizon,Math.round(ratio*profile.horizon))),d=data[year],x=sx(year);guide.setAttribute('x1',x);guide.setAttribute('x2',x);guide.setAttribute('opacity',1);projectionTooltip(e,d)});
  hover.addEventListener('pointerleave',()=>{guide.setAttribute('opacity',0);hideTooltip()});
}

function splitNetSegments(data,sx){
  const positive=[],negative=[];
  const store=(segment,sign)=>{if(segment.length>1)(sign>=0?positive:negative).push(segment)};
  let previous={x:sx(data[0].year),value:data[0].free},sign=Math.sign(previous.value)||1,segment=[previous];
  data.slice(1).forEach(row=>{
    const next={x:sx(row.year),value:row.free},nextSign=Math.sign(next.value)||sign;
    if(nextSign!==sign){
      const ratio=-previous.value/(next.value-previous.value),cross={x:previous.x+(next.x-previous.x)*ratio,value:0};
      segment.push(cross);store(segment,sign);segment=[cross,next];sign=nextSign;
    }else{segment.push(next)}
    previous=next;
  });
  store(segment,sign);
  return {positive,negative};
}

function netCashChart(){
  const svg=document.querySelector('#netCashChart');svg.innerHTML='';const W=920,H=145,m={l:58,r:20,t:16,b:30},x0=m.l,x1=W-m.r,y0=H-m.b,y1=m.t,data=projectionRows();
  const max=Math.max(...data.map(d=>Math.abs(d.free)),1),domain=Math.ceil(max/100000)*100000,sx=y=>scale(y,0,profile.horizon,x0,x1),sy=v=>scale(v,-domain,domain,y0,y1),zero=sy(0);
  [-domain,0,domain].forEach(value=>{const y=sy(value);line(svg,x0,y,x1,y,value===0?'axis-line':'grid-line');sText(svg,x0-8,y+3,`${value<0?'-':''}${(Math.abs(value)/1e6).toFixed(1)}M`,'axis-text','end')});
  [0,5,10,15,19].forEach(year=>sText(svg,sx(year),y0+18,`Yr ${year}`,'axis-text','middle'));
  const segments=splitNetSegments(data,sx);
  const areaPath=segment=>`M ${segment[0].x} ${zero} L ${segment.map(point=>`${point.x} ${sy(point.value)}`).join(' L ')} L ${segment[segment.length-1].x} ${zero} Z`;
  const linePath=segment=>`M ${segment.map(point=>`${point.x} ${sy(point.value)}`).join(' L ')}`;
  if(segments.positive.length){svg.appendChild(svgEl('path',{d:segments.positive.map(areaPath).join(' '),class:'net-area-good'}));svg.appendChild(svgEl('path',{d:segments.positive.map(linePath).join(' '),class:'net-line-good'}));}
  if(segments.negative.length){svg.appendChild(svgEl('path',{d:segments.negative.map(areaPath).join(' '),class:'net-area-risk'}));svg.appendChild(svgEl('path',{d:segments.negative.map(linePath).join(' '),class:'net-line-risk'}));}
  const hover=svgEl('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'rgba(0,0,0,0)'});svg.appendChild(hover);
  hover.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),ratio=(((e.clientX-r.left)/r.width)*W-x0)/(x1-x0),year=Math.max(0,Math.min(profile.horizon,Math.round(ratio*profile.horizon))),d=data[year];projectionTooltip(e,d)});hover.addEventListener('pointerleave',hideTooltip);
}

function cashCallout(){
  const selected=byId(selectedId),data=projectionRows('nominal'),withPremium=Math.min(...data.map(d=>d.free)),capacity=withPremium>=0;
  document.querySelector('#cashCallout').innerHTML=`<div><span class="callout-label">A caring cash-flow check</span><div class="callout-value">${capacity?`${profile.name} can stay on track`:'This plan needs more room'}</div><p>With <strong>${selected.name}</strong>, the smallest yearly amount left after living costs, education and premiums is <strong>THB ${money(withPremium)}</strong>. This is the buffer for surprises and everyday choices.</p></div><div class="status">${selected.premium<=6000?'A comfortable monthly contribution':selected.premium<=10000?'Works best with a steady monthly budget':`More than ${profile.name} has available each month`}</div>`;
}
function coverageMap(){
  const rows=[['Accident',profile.heldAccidentCover,true],['Life income protection',0],['Education wealth',0],['Retirement income',0],['Critical illness',0]];const max=profile.neededCoverage;document.querySelector('#coverageMap').innerHTML=rows.map(([name,val,held])=>`<div class="coverage-row ${held?'held':''}"><span>${name}</span><div class="coverage-bar-bg"><div class="coverage-bar" style="width:${val/max*100}%"></div></div><strong>${val?compact(val):'No cover'}</strong></div>`).join('');
}
function recommendation(){
  const best=policies.reduce((a,b)=>a.overall>b.overall?a:b);document.querySelector('#recommendation').innerHTML=`<p class="eyebrow">A thoughtful next step</p><h3>Give ${profile.name}'s family a little more certainty.</h3><p>Begin with life protection for ${profile.name}, then set aside education money at a pace that still leaves room for everyday surprises. The strongest balanced starting point is <strong>${best.name}</strong> at THB ${money(best.premium)}/month, subject to a personal illustration.</p><div class="priority"><b>1</b><span><strong>Protect THB 5.0M of ${profile.name}'s life need</strong><br>Her child depends on one income.</span></div><div class="priority"><b>2</b><span><strong>Set aside education money</strong><br>The future goal is about ${compact(educationFuture)}.</span></div><div class="priority"><b>3</b><span><strong>Start a retirement habit</strong><br>No retirement money is recorded yet.</span></div>`;
}

function showTooltip(e,p){const tip=document.querySelector('#tooltip');let body=p.custom||`<span class="tip-score">Overall fit ${p.overall}/100</span><br>Protection: ${p.protection} - Premium efficiency: ${p.premiumScore}<br>Purpose alignment: ${p.education} - Flexibility: ${p.flexibility}<br>Value efficiency: ${p.value}<br><br>${p.fact}<br><br>Illustrative premium: THB ${money(p.premium)}/month<br>Selected cover: ${p.cover?compact(p.cover):'Child is insured'}`;tip.innerHTML=`<strong>${p.name}</strong>${body}`;tip.style.display='block';moveTooltip(e)}
function moveTooltip(e){const tip=document.querySelector('#tooltip'),x=Math.min(window.innerWidth-tip.offsetWidth-12,e.clientX+14),y=Math.min(window.innerHeight-tip.offsetHeight-12,e.clientY+14);tip.style.left=`${x}px`;tip.style.top=`${y}px`}
function hideTooltip(){document.querySelector('#tooltip').style.display='none'}

document.querySelectorAll('#customerName, #customerNameLead').forEach(el=>{el.textContent=profile.name});
document.querySelectorAll('.segmented button').forEach(b=>b.addEventListener('click',()=>{valueBasis=b.dataset.basis;document.querySelectorAll('.segmented button').forEach(button=>button.classList.toggle('active',button===b));projectionChart();netCashChart()}));
document.querySelector('#clearBrush').addEventListener('click',()=>{brushedIds=new Set(policies.map(p=>p.id));renderLinked()});
metricStrip(); faces(); scatter(); radar(); coverageBars(); projectionChart(); netCashChart(); cashCallout(); coverageMap(); recommendation();
