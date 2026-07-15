import {ASSOCIATIONS,CATEGORIES,CRYPTO,GENERIC,MODIFIERS,TAGS} from './config.js';

const title = s => String(s).trim().split(/\s+/).map(w => w.length < 3 && w.toUpperCase() === w ? w : w[0]?.toUpperCase()+w.slice(1).toLowerCase()).join(' ');
const compact = s => title(s).replace(/[^a-z0-9]/gi,'');
const hash = s => [...s].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,7)>>>0;
const pick = (arr,seed) => arr[hash(seed)%arr.length];
const uniq = a => [...new Set(a.filter(Boolean))];

function lookup(term){
  const words=term.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const hits=words.map(w=>ASSOCIATIONS[w]).filter(Boolean);
  if(!hits.length) return {...GENERIC,core:uniq([term,...GENERIC.core]),mutations:uniq([mutateWord(term),...GENERIC.mutations])};
  return Object.fromEntries(['core','visual','characters','mutations'].map(k=>[k,uniq(hits.flatMap(x=>x[k]||[]))]));
}

function mutateWord(word){
  const w=word.toLowerCase().replace(/\s/g,'');
  if(w.length<3)return w+'r';
  return w.replace(/[aeiou](?=.)/,'').replace(/s$/,'z');
}

export function buildContextMap(primary,context,keywords=''){
  const a=lookup(primary),b=lookup(context);
  const extra=keywords.split(',').map(x=>x.trim()).filter(Boolean);
  return {primary:title(primary),context:title(context),a,b,extra,
    concepts:uniq([...a.core,...b.core,...a.visual,...b.visual,...extra]),
    characters:uniq([...a.characters,...b.characters]),
    visuals:uniq([...a.visual,...b.visual,...extra])};
}

function blend(a,b){
  a=compact(a);b=compact(b);if(!a||!b)return a+b;
  const cuts=[Math.ceil(a.length*.55),Math.ceil(a.length*.7)];
  const starts=[Math.floor(b.length*.25),Math.floor(b.length*.4),0];
  return uniq(cuts.flatMap(c=>starts.map(s=>a.slice(0,c)+b.slice(s)))).map(title);
}

function categoryCandidates(map){
  const P=map.primary,C=map.context,A=map.a.core.slice(0,9),B=map.b.core.slice(0,9),V=map.visuals.slice(0,8),X=map.characters.slice(0,8);
  const pairs=A.flatMap((a,i)=>B.slice(0,7).flatMap((b,j)=>[`${title(a)} ${title(b)}`,`${title(b)} ${title(a)}`,`${compact(a)}${compact(b)}`,`${title(a)} x ${title(b)}`,`${title(a)} vs ${title(b)}`,`${title(a)} & ${title(b)}`]));
  const wordplay=A.flatMap((a,i)=>B.flatMap((b,j)=>[...blend(a,b),...blend(b,a),`${title(a)}ador`,`${title(b)}zilla`,`${title(a)}nado`,`${title(b)}ified`])).slice(0,220);
  const muts=uniq([...(map.a.mutations||[]),mutateWord(P),...(map.b.mutations||[]),mutateWord(C)]).flatMap((m,i)=>[
    `${title(m)} ${title(B[i%B.length]||C)}`,`${compact(m)}${compact(B[(i+2)%B.length]||C)}`,`${title(m)}z`,`${title(m)}boi`,`${title(m)}maxx`,`${title(m)}posting`
  ]);
  const narratives=A.flatMap((a,i)=>{const b=B[i%B.length],v=V[i%V.length]||'timeline';return [`The ${title(a)} Who Beat ${title(b)}`,`Revenge of the ${title(a)}`,`${title(a)} in a ${title(b)} World`,`The Last ${title(a)} Standing`,`${title(a)} Chased the ${title(b)}`,`${title(a)} at the ${title(v)}`,`Son of ${title(a)}`,`${title(b)} Stole My ${title(a)}`]});
  const meme=MODIFIERS.flatMap((m,i)=>[`${m} ${title(A[i%A.length]||P)}`,`${m} ${title(B[i%B.length]||C)}`,`${title(A[i%A.length]||P)} Junior`,`${title(A[i%A.length]||P)} 2.0`]);
  const crypto=CRYPTO.flatMap((c,i)=>{const a=A[i%A.length]||P,b=B[(i+2)%B.length]||C;return [`${title(a)}${c==='wif'?'wif':title(c)}${compact(b)}`,`${title(a)} ${c}`,`${title(b)} ${c}`,`Giga${compact(a)}${compact(b)}`,`${title(a)} ${title(b)} CTO`,`${title(a)} on SOL`,`${title(a)} ${c} Club`]});
  const absurd=A.flatMap((a,i)=>{const b=B[i%B.length],v=V[(i+3)%V.length]||'casino',x=X[i%X.length]||'intern';return [`${title(a)} Ate the ${title(b)}`,`${title(x)} in a ${title(a)} Suit`,`${title(a)} With a ${title(v)}`,`Certified ${title(a)} Moment`,`${title(b)} Forgot Its Password`,`${title(a)} Has No Dev`,`Unemployed ${title(b)}`,`${title(a)} From Accounting`]});
  const phrases=A.flatMap((a,i)=>{const b=B[i%B.length];return [`The ${title(a)} Is ${title(b)}`,`${title(a)} Bought the Top`,`${title(b)} Forgot the ${title(a)}`,`Nobody Stops the ${title(a)}`,`${title(a)} Thinks It Is ${title(b)}`,`We Are All ${title(a)} Now`,`${title(a)} Controls the Timeline`,`${title(b)} Season Is Over`]});
  const experiment=A.flatMap((a,i)=>{const b=B[(i+2)%B.length],v=V[i%V.length]||'void';return [`Project ${compact(a).toUpperCase()}`,`Operation ${title(b)}`,`${title(v)} Protocol`,`The ${title(a)} Singularity`,`${title(a)} Zero`,`${title(b)} After Dark`,`House of ${title(a)}`,`${title(a)} Without Borders`,`Department of ${title(b)}`]});
  const best=[...wordplay.slice(0,35),...narratives.slice(0,28),...crypto.slice(0,28),...absurd.slice(0,18),...pairs.slice(0,25)];
  return {'Best Overall':best,'Direct Derivatives':pairs,'Wordplay & Portmanteaus':wordplay,'Internet Spellings':muts,'Narrative Names':narratives,'Meme Format Variations':meme,'Crypto & Solana':crypto,'Absurd & Unexpected':absurd,'Phrase-Based Names':phrases,'Experimental Names':experiment};
}

function normalize(s){return s.toLowerCase().replace(/\b(the|a|an)\b/g,'').replace(/[^a-z0-9]/g,'');}
function tickerFor(name,used){
  const clean=name.replace(/\b(the|of|and|with|in|is|at|on|my|who|its|from)\b/gi,' ').replace(/[^a-z0-9 ]/gi,' ').trim();
  const words=clean.split(/\s+/).filter(Boolean);let base;
  if(words.length>1)base=words.map(w=>w[0]).join('').slice(0,5)+(words[0].length>4?words[0].slice(1,3):'');
  else base=(words[0]||'MEME').replace(/[aeiou]/gi,'').slice(0,6) || (words[0]||'MEME').slice(0,6);
  base=base.toUpperCase().slice(0,8);if(base.length<3)base=(base+'X'+String(hash(name)%99)).slice(0,4);
  let out=base,n=2;while(used.has(out))out=(base.slice(0,Math.max(2,7-String(n).length))+n++).slice(0,8);used.add(out);return '$'+out;
}

function riskFor(name){
  const n=name.toLowerCase();
  if(/trump|biden|musk|president|maga/.test(n))return 'Political / impersonation risk';
  if(/pepe|doge|disney|pokemon|mario/.test(n))return 'Trademark / character risk';
  if(/retard|slur/.test(n))return 'Platform-policy risk';return '';
}

function explain(category,map,name){
  const lines={
    'Best Overall':'Balances instant recognition with a distinct visual identity.',
    'Direct Derivatives':'Makes the core relationship immediately legible on the timeline.',
    'Wordplay & Portmanteaus':'Compresses both concepts into a sticky, ownable sound.',
    'Internet Spellings':'Feels typed by the timeline—not polished by a committee.',
    'Narrative Names':'Implies a conflict and gives the launch built-in lore.',
    'Meme Format Variations':'Uses a familiar meme frame with a context-specific twist.',
    'Crypto & Solana':'Reads naturally in a ticker, raid post, and fast-launch thread.',
    'Absurd & Unexpected':'Creates a ridiculous visual that can become the whole campaign.',
    'Phrase-Based Names':'Works like a caption people can repeat without explanation.',
    'Experimental Names':'Leaves enough mystery to build a cult-like narrative.'};return lines[category];
}

function scoreName(name,category,map,modes,creativity){
  let s=60+(hash(name+map.primary+map.context)%25);const len=name.length;
  if(len>=5&&len<=20)s+=7;if(category==='Best Overall')s+=7;if(category==='Wordplay & Portmanteaus')s+=4;
  if(modes.brandable&&len<=16)s+=5;if(modes.narrative&&/The |Who|Revenge|Season|Controls/.test(name))s+=6;
  if(modes.absurd&&category==='Absurd & Unexpected')s+=8;if(modes.trenches&&/wif|SOL|CTO|Giga|boi|rekt/i.test(name))s+=5;
  s+=Math.round((creativity-50)/18);return Math.max(35,Math.min(99,s));
}

export function generateNames({primary,context,keywords='',count=250,creativity=72,modes={trenches:true},seed=0}){
  if(!primary?.trim()||!context?.trim())throw new Error('Add both a primary meta and a context.');
  const map=buildContextMap(primary,context,keywords),pools=categoryCandidates(map),usedNames=new Set(),usedTickers=new Set(),out=[];
  const each=Math.ceil(Number(count)/CATEGORIES.length)+5;
  for(const category of CATEGORIES){
    const pool=pools[category]||[];const rotated=pool.slice(seed%Math.max(1,pool.length)).concat(pool.slice(0,seed%Math.max(1,pool.length)));
    let added=0;for(const raw of rotated){const name=title(raw),key=normalize(name);if(key.length<3||usedNames.has(key))continue;usedNames.add(key);
      const risk=riskFor(name);let tags=[...TAGS[category]];if(risk)tags.push('Risk');
      out.push({name,ticker:tickerFor(name,usedTickers),score:scoreName(name,category,map,modes,creativity),category,explanation:explain(category,map,name),tags,risk});if(++added>=each)break;
    }
  }
  // Fill from all unused candidates if a narrow association produced too few in one category.
  const all=CATEGORIES.flatMap(c=>(pools[c]||[]).map(name=>({name,category:c})));
  for(let i=0;out.length<Number(count)&&i<all.length;i++){const item=all[(i+seed*7)%all.length],name=title(item.name),key=normalize(name);if(usedNames.has(key))continue;usedNames.add(key);out.push({name,ticker:tickerFor(name,usedTickers),score:scoreName(name,item.category,map,modes,creativity),category:item.category,explanation:explain(item.category,map,name),tags:[...TAGS[item.category]],risk:riskFor(name)});}
  return {map,names:out.sort((a,b)=>b.score-a.score).slice(0,Number(count)).map((x,i)=>({...x,rank:i+1}))};
}

export function expandName(item,action,map){
  const p=map.primary,c=map.context,short=compact(item.name).slice(0,12),char=pick(map.characters.length?map.characters:GENERIC.characters,item.name);
  const data={
    similar:[`${item.name} Club`,`${item.name} Jr`,`${item.name} Returns`,`${item.name} Zero`,`House of ${item.name}`],
    shorter:[short,short.slice(0,8),compact(p)+compact(c).slice(0,3),compact(item.name).replace(/[aeiou]/gi,'').slice(0,9)],
    absurd:[`${item.name} Ate My Wallet`,`Unemployed ${item.name}`,`${item.name} Has WiFi`,`The IRS Hates ${item.name}`,`${item.name} From Accounting`],
    crypto:[`${item.name} CTO`,`${item.name} on SOL`,`Giga ${item.name}`,`${item.name} wif Bags`,`Based ${item.name}`],
    narrative:[`Revenge of ${item.name}`,`${item.name} Bought the Top`,`The Last ${item.name}`,`${item.name} Controls the Timeline`,`${item.name} Never Sold`],
    spellings:[mutateWord(item.name),compact(item.name)+'z',compact(item.name).replace(/o/gi,'0'),compact(item.name).replace(/i/gi,'1'),compact(item.name)+'rr'],
    characters:[title(char),...map.characters.slice(0,4).map(title)],
    tickers:[item.ticker,'$'+short.replace(/[aeiou]/gi,'').slice(0,6).toUpperCase(),'$'+compact(p).slice(0,3).toUpperCase()+compact(c).slice(0,3).toUpperCase(),'$'+short.slice(0,5).toUpperCase()],
    lore:[`${item.name} appeared when ${p.toLowerCase()} entered the ${c.toLowerCase()} narrative. It does not promise utility; it promises to outlive the discourse. Every green candle adds a chapter, every dip creates a villain, and the holders call themselves The Forged.`],
    logo:[`A high-contrast mascot combining ${p.toLowerCase()} with ${c.toLowerCase()}. Use one oversized silhouette, a single acid-green accent, thick black keylines, and a tiny ${item.ticker} mark. It should remain recognizable at 32×32 pixels.`]
  };return uniq(data[action]||[]);
}
