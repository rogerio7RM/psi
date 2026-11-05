import fs from 'node:fs';
const [,,file,kind]=process.argv;
const x=JSON.parse(fs.readFileSync(file,'utf8'));
if(x.kind!==kind) throw Error('Wrong edition kind');
if(/TESTE HISTÓRICO|TESTE SINTÉTICO|HISTORICAL|SYNTHETIC/i.test(x.title+' '+x.summary)) throw Error('Test content cannot be published as live');
// A live edition must read like financial journalism, not a test or model log.
const editorialText=[x.title,x.summary,...(x.drivers||[]).flatMap(d=>[d.reason,d.impact]),...(x.sections||[]).flatMap(s=>[s.content,...(s.items||[])])].filter(v=>typeof v==='string').join(' ');
const normalized=editorialText.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
if(/\\b(?:prototipo|pacote de dados|pacote de pesquisa|versao prototipo|modelo de linguagem|consulte fontes financeiras confiaveis|informacoes fornecidas|processamento editorial)\\b/i.test(normalized))
  throw Error('Live editorial quality gate: prototype or internal research commentary detected');
if(/\\bnao ha eventos programados\\b/i.test(normalized) && (!x.agenda||x.agenda.length===0))
  throw Error('Live editorial quality gate: an empty verified agenda is not proof of no scheduled events');
if(typeof x.summary!=='string'||x.summary.trim().length<150)
  throw Error('Live editorial quality gate: executive summary is too shallow');
if((x.drivers||[]).some(d=>!d.reason||!d.impact||String(d.impact).trim().length<45))
  throw Error('Live editorial quality gate: market drivers lack explanation');
const sections=(x.sections||[]);
if(sections.length!==6||sections.some(s=>{
  const body=typeof s.content==='string'?s.content:Array.isArray(s.items)?s.items.join(' '):'';
  return body.trim().length<100;
})) throw Error('Live editorial quality gate: sections are too superficial');
const now=new Date();
const ny=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'2-digit',month:'2-digit',day:'2-digit'}).formatToParts(now);
const code=['year','month','day'].map(k=>ny.find(p=>p.type===k).value).join('');
if(x.date!==code) throw Error('Edition date differs from current NY session: '+x.date+' vs '+code);
if(!Number.isFinite(Date.parse(x.updatedAtMadrid)) || Math.abs(now-Date.parse(x.updatedAtMadrid))>20*60*1000) throw Error('Generated timestamp is stale');
console.log('Live edition passed date and test-label checks',file);
