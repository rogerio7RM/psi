import fs from 'node:fs/promises';

const kind=process.argv[2];
if(!['morning','afterclose'].includes(kind)) throw new Error('kind must be morning or afterclose');
const local=process.env.EDITORIAL_PROVIDER==='ollama';
if(!local && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
if(!process.env.EDITORIAL_RESEARCH_FILE && !process.env.BIGDATA_API_KEY) throw new Error('BIGDATA_API_KEY missing');

const now=new Date();
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
const get=t=>parts.find(p=>p.type===t)?.value;
const iso=process.env.EDITORIAL_TEST_DATE && process.env.EDITORIAL_RESEARCH_FILE
  ? process.env.EDITORIAL_TEST_DATE
  : `${get('year')}-${get('month')}-${get('day')}`;
if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('Invalid EDITORIAL_TEST_DATE: '+iso);
const code=iso.slice(2).replaceAll('-','');

async function bigdataResearch(){
  if(process.env.BIGDATA_PAID_RESEARCH_ENABLED!=='true') throw new Error('Paid Bigdata research disabled. Set BIGDATA_PAID_RESEARCH_ENABLED=true explicitly.');
  const phase=kind==='morning'
    ? 'before the regular US cash session: emphasize current/pre-market conditions and what matters for today'
    : 'after the regular US cash session: emphasize the completed close, what moved and what matters next';

  const prompt=`Build a SHORT, focused factual source pack for PrimeSphere Intelligence for ${iso}, ${phase}.
Use the smallest number of necessary sources and do not invent missing values. Do not search regulatory filings, earnings transcripts, corporate fundamentals, podcasts or premium news unless essential to a top driver. Do not repeat queries. Maximum 3 market drivers, 5 verified agenda items, 5 earnings items and 6 sources. Keep research concise.
Cover:
1) US market snapshot: S&P 500, Nasdaq-100, Dow, Russell 2000, VIX, US 10Y Treasury, WTI, gold, Bitcoin and USD/BRL. Clearly distinguish futures/pre-market from completed cash-session data.
2) The most important market drivers with numbers, catalyst/reason and likely market impact.
3) US economic calendar ONLY for official releases/events dated ${iso}. For every event provide release datetime/timezone, actual if already released, consensus and previous. Exclude an event if date/time or required comparison data cannot be verified.
4) Corporate calendar/earnings dated ${iso}, prioritizing relevant US-listed companies and verified timing.
5) Important company/premarket movers or closing movers, with catalyst and price move only when verified.
6) Sector/market themes and relevant Brazil-to-US context.
7) Source names and URLs/references for factual claims.
Return a concise research pack for another model to edit; do not fabricate or fill gaps.`;

  const body={
    template:{
      name:`PrimeSphere Editorial Source Pack ${kind}`,
      prompt,
      research_plan:{
        title:'Focused PrimeSphere daily research',
        steps:[
          {description:'In one concise pass verify cross-asset market snapshot, three drivers, exact-date economic agenda and relevant earnings with source references; omit unavailable data'}
        ]
      }
    },
    input:{},
    model_name:process.env.BIGDATA_MODEL||'base'
  };

  const r=await fetch('https://agents.bigdata.com/v1/workflow/execute',{
    method:'POST',
    headers:{'X-API-KEY':process.env.BIGDATA_API_KEY,'Content-Type':'application/json','Accept':'text/event-stream'},
    body:JSON.stringify(body)
  });
  if(!r.ok) throw new Error('Bigdata workflow failed '+r.status+' '+await r.text());

  const stream=await r.text();
  let answer='';
  const sources=[];
  let apiError='';
  for(const line of stream.split(/\r?\n/)){
    if(!line.startsWith('data: ')) continue;
    let event;
    try{ event=JSON.parse(line.slice(6)); }catch{ continue; }
    const delta=event?.delta||{};
    if(delta.type==='ANSWER' && delta.content) answer+=delta.content;
    if(delta.type==='GROUNDING'){
      for(const ref of delta.references||[]){
        if(ref?.source) sources.push(ref.source);
      }
    }
    if(delta.type==='ERROR') apiError=typeof delta.error==='string'?delta.error:JSON.stringify(delta.error);
  }
  if(apiError) throw new Error('Bigdata workflow stream error: '+apiError);
  if(!answer.trim()) throw new Error('Bigdata workflow returned no research answer');
  // Bigdata can emit a very large research stream. The editor only needs a compact,
  // factual source pack; cap what is sent to OpenAI to keep TPM/cost predictable.
  const MAX_RESEARCH_CHARS=local?12000:20000;
  const MAX_SOURCES=12;
  const compactAnswer=answer.trim().slice(0,MAX_RESEARCH_CHARS);
  const compactSources=[...new Set(sources)].slice(0,MAX_SOURCES);
  if(answer.trim().length>MAX_RESEARCH_CHARS){
    console.log('Bigdata research compacted from',answer.trim().length,'to',compactAnswer.length,'characters');
  }
  return {answer:compactAnswer,sources:compactSources};
}

const research=process.env.EDITORIAL_RESEARCH_FILE
  ? JSON.parse(await fs.readFile(process.env.EDITORIAL_RESEARCH_FILE,'utf8'))
  : await bigdataResearch();

const system=`You are PrimeSphere Intelligence's financial editor. Return ONLY valid JSON matching Editorial Edition V2. Audience: Brazilians following US markets. WRITE ALL HUMAN-READABLE EDITORIAL TEXT EXCLUSIVELY IN NATURAL BRAZILIAN PORTUGUESE (pt-BR), including title, summary, driver reason/impact, section content and agenda names. Preserve proper nouns, market tickers, product labels and mandatory section names. Never invent data. Use only the supplied Bigdata research pack. Edition date must be ${iso}. For economic agenda include ONLY events whose official date is exactly ${iso}; require New York time, Madrid conversion, status, consensus and previous. If any is missing or ambiguous, exclude it. For released events require result. Exactly 3 drivers; JSON property names MUST be number, reason, impact (English keys), while their string VALUES MUST be Brazilian Portuguese. Never translate JSON keys. kind=${kind}. schemaVersion=2. date=${code}. Required sections for morning: Market Pulse, Premarket Movers, Earnings Radar, Market Themes, Brasil → EUA, O que observar hoje. Required sections for afterclose: Market Pulse, Destaques do fechamento, Earnings Radar, Market Themes, Brasil → EUA, O que observar amanhã. sources must contain at least two identifiable source names/references from the supplied research. updatedAtMadrid must be a real Europe/Madrid timestamp. If historical offline research is used, date the edition to that historical date and explicitly state in the title and summary that it is a TESTE HISTÓRICO, not a live edition. Do not silently convert stale or previous-session data into current data. If the supplied pack is synthetic or unverified, explicitly mark the title and summary as TESTE SINTÉTICO, never invent numerical index values, prices, percentages, earnings, releases or sources, and do not suggest actual market direction. For markets without verified values, use null for numeric fields rather than invented numbers. Do not turn methodological QA themes into actual market events.`;

const user=JSON.stringify({date:iso,kind,bigdataResearch:research});
let raw;
if(local){
  const endpoint=process.env.OLLAMA_URL||'http://127.0.0.1:11434';
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),24*60*1000);
  try{
    const r=await fetch(endpoint+'/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        model:process.env.OLLAMA_MODEL||'qwen2.5:7b',
        stream:true,
        format:'json',
        keep_alive:'10m',
        options:{temperature:0.1,num_ctx:8192,num_predict:5500},
        messages:[
          {role:'system',content:system+' Output JSON keys: schemaVersion,date,kind,label,title,updatedAtMadrid,summary,markets,drivers,sections,agenda,sources. markets must be an array of at least 4 items; drivers exactly 3; sections exactly 6, using the six mandatory names for this edition; agenda an array, empty if unverified; sources at least 2. Each driver must contain a number, reason and impact. Keep claims tied to the provided research. Every natural-language field must be in Brazilian Portuguese; this requirement is mandatory. Never create a numeric market value absent from the research.'},
          {role:'user',content:user}
        ]
      })
    });
    if(!r.ok) throw new Error('Ollama request failed '+r.status+' '+await r.text());
    // Streaming returns HTTP headers immediately, avoiding Node's default
    // headers timeout while CPU-only Ollama generates a long JSON edition.
    const reader=r.body?.getReader();
    if(!reader) throw new Error('Ollama returned no response stream');
    const decoder=new TextDecoder();
    let pending='';
    let completed=false;
    let content='';
    const consume=(line)=>{
      if(!line.trim()) return;
      const part=JSON.parse(line);
      if(part.error) throw new Error('Ollama stream error: '+part.error);
      content+=part.message?.content||'';
      if(part.done) completed=true;
    };
    while(true){
      const {value,done}=await reader.read();
      if(done) break;
      pending+=decoder.decode(value,{stream:true});
      let end;
      while((end=pending.indexOf('\n'))!==-1){
        consume(pending.slice(0,end));
        pending=pending.slice(end+1);
      }
    }
    pending+=decoder.decode();
    if(pending.trim()) consume(pending);
    if(!completed) throw new Error('Ollama stream ended before completion');
    raw=content;
    if(!raw) throw new Error('Ollama returned no JSON');
  }finally{clearTimeout(timeout);}
}else{
  const r=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:process.env.OPENAI_MODEL||'gpt-5.6',
      input:[{role:'system',content:system},{role:'user',content:user}],
      text:{format:{type:'json_object'}},
      store:false
    })
  });
  if(!r.ok) throw new Error('OpenAI request failed '+r.status+' '+await r.text());
  const data=await r.json();
  raw=data.output_text ?? data.output?.flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text;
  if(!raw) throw new Error('OpenAI returned no JSON');
}
const edition=JSON.parse(raw);
// Normalize only explicit, unambiguous structural aliases; never invent content.
if(Array.isArray(edition.sections)){
  edition.sections=edition.sections.map((section,i)=>{
    if(!section||typeof section!=='object'||Array.isArray(section)) return section;
    const name=section.name??section.nome??section.title??section.titulo??section.título;
    const content=section.content??section.conteudo??section.conteúdo??section.text??section.texto;
    const normalized={...section};
    if(typeof name==='string'&&name.trim()) normalized.name=name.trim();
    if(typeof content==='string'&&content.trim()) normalized.content=content.trim();
    return normalized;
  });
}
if(Array.isArray(edition.drivers)){
  edition.drivers=edition.drivers.map(d=>{
    if(!d||typeof d!=='object'||Array.isArray(d)) return d;
    const normalized={...d};
    if(normalized.number==null && (d.número!=null||d.numero!=null)) normalized.number=d.número??d.numero;
    if(normalized.reason==null && (d.motivo!=null||d.razão!=null)) normalized.reason=d.motivo??d.razão;
    if(normalized.impact==null && d.impacto!=null) normalized.impact=d.impacto;
    delete normalized.número;delete normalized.numero;delete normalized.motivo;delete normalized.razão;delete normalized.impacto;
    return normalized;
  });
}
edition.schemaVersion=2;
edition.date=code;
edition.kind=kind;
// Structural metadata is deterministic and must never depend on model compliance.
edition.label=kind==='morning'?'Morning Brief':'After Market';
edition.title=typeof edition.title==='string' && edition.title.trim()
  ? edition.title.trim()
  : (kind==='morning'?'Morning Brief — PrimeSphere Intelligence':'After Market — PrimeSphere Intelligence');
edition.updatedAtMadrid=typeof edition.updatedAtMadrid==='string' && edition.updatedAtMadrid.trim()
  ? edition.updatedAtMadrid
  : new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace(' ','T');
const suffix=kind==='afterclose'?'-afterclose':'';
await fs.writeFile(`src/react-app/editions/${code}${suffix}.json`,JSON.stringify(edition,null,2)+'\n');
console.log('Generated',code,kind,'from Bigdata Research Workflow via',local?'local Ollama':'OpenAI');
