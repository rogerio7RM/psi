import fs from 'node:fs';

// Presentation adapter: runs AFTER the numeric edition has passed existing QA.
// No new research and no rewriting of factual claims.
const file=process.argv[2];
if(!file) throw Error('Usage: node scripts/format-morning-golden.mjs <edition.json>');
const x=JSON.parse(fs.readFileSync(file,'utf8'));
if(x.kind!=='morning') throw Error('Golden adapter is Morning Brief only');
const banned=/\b(?:arquivo|json|pacote de pesquisa|dados n[aã]o verificados|n[aã]o foi poss[ií]vel verificar|sem comprova[cç][aã]o|auditoria|processamento|QA|modelo de linguagem)\b/i;
const editorial=[x.summary,...x.drivers.flatMap(d=>[d.reason,d.impact]),...x.sections.map(s=>s.content)];
const offending=editorial.filter(t=>banned.test(t||''));
if(offending.length) throw Error('Editorial text contains internal processing commentary: '+offending[0].slice(0,160));
const formatPct=n=>(n>=0?'+':'')+n.toFixed(2).replace('.',',')+'%';
x.markets=x.markets.map(m=>({name:m.name,value:typeof m.change==='number'?formatPct(m.change):typeof m.value==='number'?m.value.toLocaleString('pt-BR'):m.value??'—'}));
x.drivers=x.drivers.map((d,i)=>({title:d.title||d.reason.split(/[.:;]/)[0].slice(0,65),number:typeof d.number==='string'&&!/^\d$/.test(d.number)?d.number:'Destaque '+(i+1),reason:d.reason,impact:d.impact}));
x.sections=x.sections.map(s=>({title:s.name,items:s.content.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/u).filter(Boolean)}));
x.title='WALL STREET ANTES DA ABERTURA';
x.label='Morning Brief · '+x.date.slice(4,6)+'/'+x.date.slice(2,4)+'/20'+x.date.slice(0,2);
const output=JSON.stringify(x,null,2)+'\n';
JSON.parse(output); // Validate the exact bytes before replacing the edition.
fs.writeFileSync(file,output,'utf8');
console.log('Golden Standard presentation applied:',file);
