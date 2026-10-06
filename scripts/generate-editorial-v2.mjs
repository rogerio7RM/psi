import fs from 'node:fs/promises';

const kind=process.argv[2];
if(!['morning','afterclose'].includes(kind)) throw new Error('kind must be morning or afterclose');
if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
if(!process.env.BIGDATA_API_KEY) throw new Error('BIGDATA_API_KEY missing');
const now=new Date();
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
const get=t=>parts.find(p=>p.type===t)?.value;
const iso=`${get('year')}-${get('month')}-${get('day')}`;
const code=iso.slice(2).replaceAll('-','');

const bigHeaders={Authorization:`Bearer ${process.env.BIGDATA_API_KEY}`,'Content-Type':'application/json'};
async function big(path,body){
 const base=process.env.BIGDATA_API_BASE_URL || 'https://api.bigdata.com';
 const r=await fetch(base+path,{method:'POST',headers:bigHeaders,body:JSON.stringify(body)});
 if(!r.ok) throw new Error('Bigdata request failed '+r.status+' '+await r.text());
 return r.json();
}
const [market,economic,corporate]=await Promise.all([
 big('/v1/tearsheets/market',{}),
 big('/v1/calendar',{calendar_type:'economic_calendar',start_date:iso,end_date:iso}),
 big('/v1/calendar',{calendar_type:'corporate_calendar',start_date:iso,end_date:iso})
]);

const system=`You are PrimeSphere Intelligence's financial editor. Return ONLY valid JSON matching Editorial Edition V2. Audience: Brazilians following US markets. Never invent data. Use only supplied source payloads. Edition date must be ${iso}. For economic agenda include ONLY events whose official date is exactly ${iso}; require official NY time, Madrid conversion, status, consensus and previous. If any is missing or ambiguous, exclude it. For released events require result. Exactly 3 drivers using NÚMERO/MOTIVO/IMPACTO. kind=${kind}. schemaVersion=2. date=${code}. Required sections for morning: Market Pulse, Premarket Movers, Earnings Radar, Market Themes, Brasil → EUA, O que observar hoje. Required sections for afterclose: Market Pulse, Destaques do fechamento, Earnings Radar, Market Themes, Brasil → EUA, O que observar amanhã. Sources must name the supplied providers.`;
const user=JSON.stringify({date:iso,kind,market,economic,corporate});
const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.6',input:[{role:'system',content:system},{role:'user',content:user}],text:{format:{type:'json_object'}}})});
if(!r.ok) throw new Error('OpenAI request failed '+r.status+' '+await r.text());
const data=await r.json();
const raw=data.output_text ?? data.output?.flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text;
if(!raw) throw new Error('OpenAI returned no JSON');
const edition=JSON.parse(raw);
edition.schemaVersion=2; edition.date=code; edition.kind=kind;
const suffix=kind==='afterclose'?'-afterclose':'';
await fs.writeFile(`src/react-app/editions/${code}${suffix}.json`,JSON.stringify(edition,null,2)+'\n');
console.log('Generated',code,kind);
