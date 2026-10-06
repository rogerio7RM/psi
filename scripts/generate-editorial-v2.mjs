import fs from 'node:fs/promises';

const kind=process.argv[2];
if(!['morning','afterclose'].includes(kind)) throw new Error('kind must be morning or afterclose');
if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
const now=new Date();
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
const get=t=>parts.find(p=>p.type===t)?.value;
const iso=`${get('year')}-${get('month')}-${get('day')}`;
const code=iso.slice(2).replaceAll('-','');
const requiredSections=kind==='morning'?['Market Pulse','Premarket Movers','Earnings Radar','Market Themes','Brasil → EUA','O que observar hoje']:['Market Pulse','Destaques do fechamento','Earnings Radar','Market Themes','Brasil → EUA','O que observar amanhã'];

const system=`You are PrimeSphere Intelligence's financial editor. Produce a factual PT-BR US-market edition for Brazilian investors. You have web search and MUST research the live web before writing. Prefer primary/official sources (BLS, BEA, Federal Reserve, Treasury, SEC, company IR) and reliable market-data/news sources. Cross-check material market claims. Never invent prices, percentage changes, consensus, previous values, earnings, times, catalysts or causalities. If a required datapoint cannot be verified, omit it or state indisponível rather than guessing.
Return ONLY one valid JSON object, no markdown fences, matching Editorial Edition V2. schemaVersion=2; date=${code}; kind=${kind}. Required keys: label,title,updatedAtMadrid,summary,markets,drivers,sections,agenda,sources.
Rules: edition date exactly ${iso}; updatedAtMadrid real Europe/Madrid timestamp; exactly 3 drivers with title,number,reason,impact following NÚMERO → MOTIVO → IMPACTO; include all sections ${requiredSections.join(', ')}; markets at least 4 verified instruments; agenda rebuilt from zero for ${iso} and ONLY official release date ${iso}; each agenda item requires name, officialDate, timeNewYork, timeMadrid, status FUTURO or JÁ DIVULGADO, consensus, previous; released events require result; exclude any agenda event with an unverifiable required field; sources at least 2 concrete source names/URLs actually used. Morning must reflect actual premarket/current state. After-close must not claim regular close unless verified.`;
const user=`Research and generate today's PrimeSphere ${kind==='morning'?'Morning Brief':'After Market'} for ${iso}. Verify market snapshot, today's US macro agenda, today's relevant earnings/corporate events, major drivers, and Brazil-to-US context. Output only JSON.`;

const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.6-terra',tools:[{type:'web_search',search_context_size:'high'}],input:[{role:'system',content:system},{role:'user',content:user}],text:{format:{type:'json_object'}}})});
if(!r.ok) throw new Error('OpenAI request failed '+r.status+' '+await r.text());
const data=await r.json();
const raw=data.output_text ?? data.output?.flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text;
if(!raw) throw new Error('OpenAI returned no JSON');
const cleaned=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
const edition=JSON.parse(cleaned);
edition.schemaVersion=2; edition.date=code; edition.kind=kind;
const suffix=kind==='afterclose'?'-afterclose':'';
await fs.writeFile(`src/react-app/editions/${code}${suffix}.json`,JSON.stringify(edition,null,2)+'\n');
console.log('Generated',code,kind,'using OpenAI Responses web search');
