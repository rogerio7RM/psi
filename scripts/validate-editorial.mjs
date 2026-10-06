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
console.log('Editorial V2 valid:',file,x.kind,x.date);
