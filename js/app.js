import {CATEGORIES} from './config.js';
import {expandName,generateNames} from './generator.js';

const $=s=>document.querySelector(s), els={primary:$('#primary'),context:$('#context'),keywords:$('#keywords'),count:$('#count'),creativity:$('#creativity'),generate:$('#generate'),results:$('#results'),rows:$('#nameRows'),search:$('#search'),category:$('#category'),minScore:$('#minScore'),drawer:$('#detailDrawer'),lab:$('#labOutput')};
let state={names:[],map:null,seed:0,visible:60,selected:null,favorites:new Set(JSON.parse(localStorage.getItem('metaForgeFavorites')||'[]')),favoritesOnly:false,modes:{trenches:true,brandable:false,absurd:false,narrative:false}};

CATEGORIES.forEach(c=>els.category.add(new Option(c,c)));
const escape=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1500)}
async function copy(text){try{await navigator.clipboard.writeText(text);toast(`Copied ${text}`)}catch{toast('Copy unavailable')}}

function run(regenerate=false,skipScroll=false){
  try{if(regenerate)state.seed++;els.generate.disabled=true;els.generate.querySelector('span').textContent='FORGING…';
    const result=generateNames({primary:els.primary.value,context:els.context.value,keywords:els.keywords.value,count:+els.count.value,creativity:+els.creativity.value,modes:state.modes,seed:state.seed});
    state.names=result.names;state.map=result.map;state.visible=60;els.results.classList.remove('hidden');
    $('#resultCount').textContent=state.names.length;$('#topScore').textContent=state.names[0]?.score||'—';$('#tickerCount').textContent=new Set(state.names.map(n=>n.ticker)).size;$('#clusterCount').textContent=new Set(state.names.map(n=>n.category)).size;
    $('#contextSummary').textContent=`${result.map.primary} × ${result.map.context} · ${result.map.concepts.slice(0,6).join(' · ')}`;render();if(!skipScroll)setTimeout(()=>els.results.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }catch(e){toast(e.message)}finally{els.generate.disabled=false;els.generate.querySelector('span').textContent='GENERATE NAMES'}
}

function filtered(){const q=els.search.value.toLowerCase(),cat=els.category.value,min=+els.minScore.value;return state.names.filter(n=>(!q||[n.name,n.ticker,n.category,...n.tags].join(' ').toLowerCase().includes(q))&&(!cat||n.category===cat)&&n.score>=min&&(!state.favoritesOnly||state.favorites.has(n.name)))}
function render(){
  const all=filtered(),shown=all.slice(0,state.visible);$('#favoriteCount').textContent=state.favorites.size;$('#emptyState').classList.toggle('hidden',all.length>0);$('#showMore').classList.toggle('hidden',shown.length>=all.length);
  els.rows.innerHTML=shown.map(n=>`<tr><td class="rank">${String(n.rank).padStart(3,'0')}</td><td><div class="name-cell"><span class="select-name" data-open="${escape(n.name)}">${escape(n.name)}</span>${n.risk?`<span class="risk" title="${escape(n.risk)}">RISK</span>`:''}</div></td><td><span class="ticker" data-copy="${escape(n.ticker)}">${escape(n.ticker)}</span></td><td><span class="score"><span class="score-bar"><i style="width:${n.score}%"></i></span>${n.score}</span></td><td><span class="category-pill">${escape(n.category)}</span></td><td class="explanation">${escape(n.explanation)}</td><td>${n.tags.slice(0,3).map(t=>`<span class="tag">${escape(t)}</span>`).join('')}</td><td><div class="row-actions"><button class="icon-btn ${state.favorites.has(n.name)?'saved':''}" data-fav="${escape(n.name)}" title="Favorite">${state.favorites.has(n.name)?'♥':'♡'}</button><button class="icon-btn" data-copy="${escape(n.name)}" title="Copy name">⧉</button><button class="icon-btn" data-open="${escape(n.name)}" title="Open signal lab">↗</button></div></td></tr>`).join('');
}
function favorite(name){state.favorites.has(name)?state.favorites.delete(name):state.favorites.add(name);localStorage.setItem('metaForgeFavorites',JSON.stringify([...state.favorites]));render();}
function openDrawer(name){const item=state.names.find(n=>n.name===name);if(!item)return;state.selected=item;$('#detailName').textContent=item.name;$('#detailTicker').textContent=item.ticker;$('#detailExplanation').textContent=item.explanation;$('#detailTags').innerHTML=item.tags.map(t=>`<span class="tag">${escape(t)}</span>`).join('')+(item.risk?`<span class="risk">${escape(item.risk)}</span>`:'');els.lab.innerHTML='<span>Select an angle to expand this signal.</span>';els.drawer.classList.add('open');els.drawer.setAttribute('aria-hidden','false')}
function closeDrawer(){els.drawer.classList.remove('open');els.drawer.setAttribute('aria-hidden','true')}
function lab(action){const output=expandName(state.selected,action,state.map);const prose=['lore','logo'].includes(action);els.lab.innerHTML=prose?`<strong>${action==='lore'?'LORE SEED':'ART DIRECTION'}</strong><br>${escape(output[0])}`:`<strong>${action.toUpperCase()}</strong><br>${output.map(escape).join('<br>')}`}
function exportCsv(){const rows=[['Rank','Name','Ticker','Score','Category','Explanation','Tags','Risk'],...filtered().map(n=>[n.rank,n.name,n.ticker,n.score,n.category,n.explanation,n.tags.join('|'),n.risk])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`meta-forge-${els.primary.value}-${els.context.value}.csv`.replace(/\s+/g,'-');a.click();URL.revokeObjectURL(a.href);toast('CSV exported')}

els.generate.addEventListener('click',()=>run(false));$('#regenerate').addEventListener('click',()=>run(true));$('#exportCsv').addEventListener('click',exportCsv);$('#showMore').addEventListener('click',()=>{state.visible+=60;render()});
els.creativity.addEventListener('input',()=>$('#creativityValue').textContent=els.creativity.value);els.minScore.addEventListener('input',()=>{$('#minScoreValue').textContent=els.minScore.value;render()});[els.search,els.category].forEach(x=>x.addEventListener(x.tagName==='INPUT'?'input':'change',render));
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.mode;state.modes[m]=!state.modes[m];b.classList.toggle('active',state.modes[m])}));
$('#favoritesOnly').addEventListener('click',e=>{state.favoritesOnly=!state.favoritesOnly;e.currentTarget.classList.toggle('active',state.favoritesOnly);render()});
els.rows.addEventListener('click',e=>{const open=e.target.closest('[data-open]'),fav=e.target.closest('[data-fav]'),cp=e.target.closest('[data-copy]');if(open)openDrawer(open.dataset.open);else if(fav)favorite(fav.dataset.fav);else if(cp)copy(cp.dataset.copy)});
document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',closeDrawer));document.querySelectorAll('[data-action]').forEach(x=>x.addEventListener('click',()=>lab(x.dataset.action)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();els.primary.focus();els.primary.select()}if(e.key==='Enter'&&document.activeElement.closest('.control-panel'))run(false)});
run(false,true);
