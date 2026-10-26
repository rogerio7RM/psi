import fs from 'node:fs';

// Bigdata's supplied research answer is the sole factual authority; no external lookups.
const [,,editionPath,researchPath]=process.argv;
if(!editionPath||!researchPath) throw Error('Usage: node scripts/audit-bigdata-edition.mjs <edition.json> <research.json>');
const x=JSON.parse(fs.readFileSync(editionPath,'utf8').replace(/^\uFEFF/,''));
if(!Array.isArray(x.markets)||x.markets.length<4||!Array.isArray(x.drivers)||x.drivers.length!==3||!Array.isArray(x.sections)||x.sections.length!==6||!Array.isArray(x.agenda)||!Array.isArray(x.sources)||x.sources.length<2){console.error('Bigdata audit: incomplete Editorial V2 structure');process.exit(1);}
const archive=JSON.parse(fs.readFileSync(researchPath,'utf8'));
const r=archive.research?.answer?archive.research:archive;
if(typeof r.answer!=='string'||r.answer.length<100) throw Error('Bigdata audit: missing research answer');
const iso='20'+x.date.slice(0,2)+'-'+x.date.slice(2,4)+'-'+x.date.slice(4);
if(archive.date&&archive.date!==iso) throw Error('Bigdata audit: research date mismatch');
if(archive.kind&&archive.kind!==x.kind) throw Error('Bigdata audit: research kind mismatch');
const errors=[],fail=s=>errors.push(s);
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const number=s=>Number(String(s).replace(/[$%~+\s]/g,'').replace(/,/g,''));
const parts=r.answer.split(/^\*\*(.+?)\*\*\s*$/m);
const section=name=>{for(let i=1;i<parts.length;i+=2)if(normalize(parts[i]).includes(normalize(name)))return parts[i+1]||'';return '';};
const snapshot=section('US Market Snapshot');
if(!snapshot) console.warn('Bigdata audit warning: structured US Market Snapshot not found; market figures cannot be independently cross-checked');
const assets=[];
for(const line of snapshot.split('\n')){
 if(!line.startsWith('|')||/^\|\s*(Asset|---)/i.test(line))continue;
 const cells=line.split('|').slice(1,-1).map(s=>s.replace(/\*\*/g,'').trim());
 if(cells.length<4||!Number.isFinite(number(cells[2])))continue;
 assets.push({name:cells[0],value:number(cells[1]),change:number(cells[2]),status:cells[3]});
}
const key=name=>{
 const n=normalize(name);
 if(n.includes('nasdaq'))return 'nasdaq';
 if(n.includes('s&p'))return 'sp';
 if(n.includes('dow'))return 'dow';
 if(n.includes('russell'))return 'russell';
 if(n.includes('vix'))return 'vix';
 if(n.includes('treasury')||n.includes('10y'))return 'treasury';
 if(n.includes('wti')||n.includes('petroleo'))return 'oil';
 if(n.includes('gold')||n.includes('ouro'))return 'gold';
 if(n.includes('bitcoin')||n.includes('btc'))return 'bitcoin';
 if(n.includes('usd/brl'))return 'fx';
 return null;
};
for(const [i,m] of (x.markets||[]).entries()){
 const instrument=key(m.name),future=/futur/i.test(normalize(m.name));
 const a=assets.find(v=>key(v.name)===instrument&&/futur/i.test(v.name)===future);
 if(!a){console.warn('Bigdata audit warning: markets['+i+'] instrument not matched in structured snapshot: '+m.name);continue;}
 if(typeof m.change==='number'&&Math.abs(m.change-a.change)>0.011)fail('markets['+i+'] '+m.name+' change '+m.change+' vs Bigdata '+a.change);
 if(typeof m.value==='number'&&Math.abs(m.value-a.value)>Math.max(0.02,Math.abs(a.value)*0.00015))fail('markets['+i+'] '+m.name+' value '+m.value+' vs Bigdata '+a.value);
}
const prose=[x.summary,...(x.sections||[]).map(s=>s.content),...(x.drivers||[]).map(d=>d.impact)].join('\n');
for(const [label,instrument,pattern] of [
 ['ouro','gold',/\bou ro\b/gi],
 ['petróleo','oil',/\bpetr[oó]leo\b/gi],
 ['bitcoin','bitcoin',/\bbitcoin\b/gi]
]){
 const a=assets.find(v=>key(v.name)===instrument&&!/futur/i.test(v.name))||assets.find(v=>key(v.name)===instrument);
 if(!a)continue;
 const re=label==='ouro'?/\bouro\b.{0,55}\b(?:caiu|caindo|recuou|recuando|queda|baixa|subiu|subindo|avan[cç]ou|alta)\b/gi:label==='petróleo'?/\bpetr[oó]leo\b.{0,55}\b(?:caiu|caindo|recuou|recuando|queda|baixa|subiu|subindo|avan[cç]ou|alta)\b/gi:/\bbitcoin\b.{0,55}\b(?:caiu|caindo|recuou|recuando|queda|baixa|subiu|subindo|avan[cç]ou|alta)\b/gi;
 for(const match of prose.matchAll(re)){
  const phrase=normalize(match[0]);
  if(a.change>0&&/(caiu|caindo|recuou|recuando|queda|baixa)/.test(phrase))fail(label+' described as falling; Bigdata '+a.change+'%');
  if(a.change<0&&/(subiu|subindo|avancou|alta)/.test(phrase))fail(label+' described as rising; Bigdata '+a.change+'%');
 }
}
const earnings=section('Corporate Calendar/Earnings');
for(const line of earnings.split('\n')){
 if(!line.startsWith('|')||/^\|\s*(Company|---)/i.test(line))continue;
 const cells=line.split('|').slice(1,-1).map(s=>s.replace(/\*\*/g,'').trim());
 if(cells.length<5||!/post.close|pre.market|scheduled|upcoming/i.test(cells[4]))continue;
 const ticker=cells[1].replace(/[^A-Z0-9.-]/gi,'');
 if(!ticker)continue;
 const re=new RegExp('\\b'+ticker+'\\b.{0,85}\\b(?:divulgou|divulgaram|divulgados|apresentou resultados|reportou resultados)\\b|\\b(?:divulgou|divulgaram|divulgados|apresentou resultados|reportou resultados)\\b.{0,85}\\b'+ticker+'\\b','i');
 if(re.test(prose))fail(ticker+' described as released; Bigdata says '+cells[4]);
}
const sourceUrls=[...new Set((r.sources||[]).map(s=>{
 if(typeof s==='string')return s;
 const embedded=typeof s?.content==='string'?s.content.match(/\]\((https?:\/\/[^)]+)\)/)?.[1]:'';
 return s?.action?.url||s?.url||embedded||'';
}).filter(s=>/^https?:\/\//.test(s)))];
if(sourceUrls.length<2)console.warn('Bigdata audit warning: fewer than two parseable Bigdata source URLs; source references retained');
for(const s of x.sources||[]){
 const u=String(s).match(/https?:\/\/[^\s<>"']+/)?.[0]?.replace(/[),.;]+$/,'');
 if(!u){console.warn('Bigdata audit warning: source reference without parseable URL');continue;}
 if(sourceUrls.length && !sourceUrls.includes(u) && !r.answer.includes(u))fail('source URL not in Bigdata pack: '+u);
}
if(errors.length){for(const e of [...new Set(errors)])console.error('Bigdata audit: '+e);process.exitCode=1;}
else console.log('Bigdata factual audit completed: '+x.date+'; '+assets.length+' structured reference market instruments; unmatched claims remain unverified; no external lookups');
