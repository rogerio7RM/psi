import fs from 'node:fs';

const file=process.argv[2];
if(!file) throw new Error('Usage: node scripts/validate-editorial.mjs <edition.json>');
const x=JSON.parse(fs.readFileSync(file,'utf8'));
const fail=(m)=>{throw new Error('Editorial validation: '+m)};
if(x.schemaVersion!==2) fail('schemaVersion must be 2');
if(!/^\d{6}$/.test(x.date)) fail('invalid YYMMDD date');
if(!['morning','afterclose'].includes(x.kind)) fail('invalid kind');
for(const k of ['label','title','updatedAtMadrid','summary']) if(typeof x[k]!=='string'||!x[k].trim()) fail('missing '+k);
if(!Array.isArray(x.markets)||x.markets.length<4) fail('markets incomplete');
if(!Array.isArray(x.drivers)||x.drivers.length!==3) fail('exactly 3 drivers required');
if(!Array.isArray(x.sections)||x.sections.length<4) fail('sections incomplete');
if(!Array.isArray(x.agenda)) fail('agenda missing');
if(!Array.isArray(x.sources)||x.sources.length<2) fail('sources incomplete');
const yy='20'+x.date.slice(0,2), mm=x.date.slice(2,4), dd=x.date.slice(4,6);
const iso=yy+'-'+mm+'-'+dd;
for(const [i,e] of x.agenda.entries()){
 if(e.officialDate!==iso) fail('agenda['+i+'] officialDate differs from edition date');
 for(const k of ['name','timeNewYork','timeMadrid','status','consensus','previous']) if(typeof e[k]!=='string'||!e[k].trim()) fail('agenda['+i+'] missing '+k);
 if(!['FUTURO','JÁ DIVULGADO'].includes(e.status)) fail('agenda['+i+'] invalid status');
 if(e.status==='JÁ DIVULGADO' && (!e.result||!String(e.result).trim())) fail('released event requires result');
}
const requiredSections=x.kind==='morning'
 ? ['Market Pulse','Premarket Movers','Earnings Radar','Market Themes','Brasil → EUA','O que observar hoje']
 : ['Market Pulse','Destaques do fechamento','Earnings Radar','Market Themes','Brasil → EUA','O que observar amanhã'];
const names=x.sections.map(s=>s?.name);
for(const name of requiredSections) if(names.filter(n=>n===name).length!==1) fail('missing or duplicated required section: '+name+'; received section names: '+JSON.stringify(names));
for(const [i,d] of x.drivers.entries()){
 if(!d||!Number.isInteger(d.number)||d.number!==i+1) fail('drivers['+i+'] must use numeric key number='+String(i+1));
 for(const k of ['reason','impact']) if(typeof d[k]!=='string'||!d[k].trim()) fail('drivers['+i+'] missing '+k);
 for(const k of ['número','motivo','impacto']) if(Object.hasOwn(d,k)) fail('drivers['+i+'] translated JSON key '+k);
}
for(const [i,s] of x.sections.entries()) if(typeof s?.content!=='string'||!s.content.trim()) fail('sections['+i+'] missing content');
// Deterministic semantic guardrails: fail closed on common, observable contradictions.
if(x.kind==='morning'){
 const prose=[x.summary,...x.sections.map(s=>s.content),...x.drivers.map(d=>d.impact)].join(' ');
 if(/\b(?:mercado|bolsa|wall street|s[eã]o p[aã]o)\b.{0,45}\b(?:abriu|fechou)\b/i.test(prose) || /\b(?:s&p 500|nasdaq(?:-100)?|dow jones|russell 2000)\b.{0,30}\bfechou\b/i.test(prose))
   fail('morning edition describes cash-market opening/closing without an explicit session boundary; use verified premarket/futures language');
 if(x.agenda.length===0 && /\b(?:ser[aá] divulgado|ser[aá] publicada|ser[aá] anunciado|est[aá] previsto|ser[aá] divulgado [aà]s)\b/i.test(x.sections.find(s=>s.name==='O que observar hoje')?.content||''))
   fail('agenda empty but watch section announces an upcoming release');
 if(/nenhum(?:a)? agenda (?:oficial )?(?:foi|est[aá])|n[aã]o h[aá] (?:agenda|eventos? (?:econ[oô]micos?|oficiais?))/i.test(prose) && /\b(?:ser[aá] divulgado|ser[aá] publicada|divulga[cç][aã]o (?:do|da)|est[aá] previsto)\b/i.test(prose))
   fail('claims no agenda while announcing a scheduled event');
}
// Compare direction only when it describes the current movement, not a previous session.
const positive=/\b(?:subiu|avan[cç]ou|alta|ganhos?|valorizou|avan[cç]ando)\b/i;
const negative=/\b(?:caiu|recuou|queda|baixa|perdas?|desvalorizou)\b/i;
const priorSession=/\b(?:ap[oó]s|depois d[aeo]|na sess[aã]o anterior|no preg[aã]o anterior)\b/i;
const currentMovement=t=>String(t).split(/[,;.]/)[0].split(/\b(?:ap[oó]s|depois d[aeo]|na sess[aã]o anterior|no preg[aã]o anterior)\b/i)[0];
const direction=t=>{const s=currentMovement(t);return positive.test(s)&&!negative.test(s)?1:negative.test(s)&&!positive.test(s)?-1:0};
for(const [i,m] of x.markets.entries()){
 if(typeof m?.name!=='string'||!m.name.trim()) fail('markets['+i+'] missing name');
 if(typeof m?.context!=='string'||!m.context.trim()) fail('markets['+i+'] missing context');
 if(typeof m.change==='number' && /\bfuturo(?:s)?\b/i.test(m.context) && !/\bfuturo(?:s)?\b/i.test(m.name))
   fail('markets['+i+'] mixes futures commentary with a cash index label');
 const d=direction(m.context);
 if(typeof m.change==='number' && d!==0 && Math.sign(m.change)!==d)
   fail('markets['+i+'] change contradicts current movement in context');
 if(m.value==null && /\b(?:n[ií]vel|cot[aá][cç][aã]o|pontos?)\s+(?:de\s+)?[\d.,]+/i.test(m.context))
   fail('markets['+i+'] quotes a precise level despite missing verified value');
}
// Cross-check explicit market directions in the headline market narrative.
// Only compare unambiguous named assets, not broad sentiment or prior sessions.
if(x.kind==='morning'){
 const narrative=[x.summary,x.sections.find(s=>s.name==='Market Pulse')?.content||''];
 const aliases=[
  /\bS&P\s*500\b/i,/\bNasdaq(?:-100)?\b/i,/\bDow Jones\b/i,/\bRussell\s*2000\b/i
 ];
 for(const [i,m] of x.markets.entries()){
  if(typeof m.change!=='number') continue;
  const asset=aliases.find(a=>a.test(m.name));
  if(!asset) continue;
  for(const [j,t] of narrative.entries()){
   // Look for explicit direction immediately following the instrument mention.
   const match=asset.exec(t);
   if(!match) continue;
   const after=t.slice(match.index+match[0].length).split(/[.;]/)[0];
   const nextAsset=after.search(/\b(?:S&P\s*500|Nasdaq(?:-100)?|Dow Jones|Russell\s*2000)\b/i);
   const scope=(nextAsset>=0?after.slice(0,nextAsset):after).slice(0,90);
   const d=direction(scope);
   if(d!==0 && Math.sign(m.change)!==d)
    fail('markets['+i+'] contradicts '+(j===0?'summary':'Market Pulse')+' direction');
  }
 }
}
// TEMPORARY (2026-10-23): skip source URL checks for Bigdata-grounded editions.
// Restore URL validation when Bigdata reference normalization is implemented.
if(process.env.EDITORIAL_STRICT_QA==='true'){
 const editorial=[x.title,x.summary,...x.drivers.flatMap(d=>[d.reason,d.impact]),...x.sections.map(s=>s.content)].filter(v=>typeof v==='string');
 const englishPatterns=[/\\bthis edition is based on\\b/i,/\\bno real market events\\b/i,/\\bsynthetic data (indicates|suggests)\\b/i,/\\btoday, investors should\\b/i,/\\bmarket monitoring techniques\\b/i,/\\bverification of synthetic data\\b/i,/\\bmethodological testing\\b/i,/\\bno earnings reports are expected\\b/i];
 for(const t of editorial) if(englishPatterns.some(p=>p.test(t))) fail('English editorial text detected in strict QA');
 if(process.env.EDITORIAL_SYNTHETIC_TEST==='true'){
  if(!/teste sint[eé]tico/i.test(x.title+' '+x.summary)) fail('synthetic edition must be prominently labeled TESTE SINTÉTICO');
  for(const [i,m] of x.markets.entries()){
   for(const [key,value] of Object.entries(m)){
    if(key!=='name' && typeof value==='number') fail('synthetic markets['+i+'] has invented numeric value '+key);
   }
  }
  if(x.agenda.length) fail('synthetic test agenda must be empty');
  const text=[x.title,x.summary,...x.drivers.flatMap(d=>[d.reason,d.impact]),...x.sections.map(s=>s.content)].join(' ');
  const unsupported=[
   /\\b(VIX|volatilidade)\\b.{0,55}\\b(em alta|subindo|aumentando|crescentes)\\b/i,
   /\\b(índices|mercados|ações)\\b.{0,65}\\b(perdas|queda|baixa|ganhos|alta|correção)\\b/i,
   /\\b(tecnologia|software)\\b.{0,60}\\b(lideram|ganhos|subiram|caíram)\\b/i,
   /\\b(equipe de (risco|monitoramento|dados))\\b.{0,85}\\b(identificou|notou|detectou)\\b/i,
   /\\b(divulga(ram|rão)|divulgou) resultados\\b/i
  ];
  if(unsupported.some(p=>p.test(text))) fail('synthetic edition asserts unsupported market movement or internal research finding');

 }
}
console.log('Editorial V2 valid:',file,x.kind,x.date);
