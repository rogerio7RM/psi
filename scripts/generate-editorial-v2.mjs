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

async function bigdataResearch(){
  const phase=kind==='morning'
    ? 'before the regular US cash session: emphasize current/pre-market conditions and what matters for today'
    : 'after the regular US cash session: emphasize the completed close, what moved and what matters next';

  const prompt=`Build a factual source pack for PrimeSphere Intelligence for ${iso}, ${phase}.
Use current financial/premium sources available to Bigdata and do not invent missing values.
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
        title:'PrimeSphere daily market research',
        steps:[
          {description:'Verify US market state and collect the required cross-asset snapshot'},
          {description:'Verify the exact-date US economic and corporate calendars'},
          {description:'Identify the three strongest market drivers and relevant movers/themes'},
          {description:'Cross-check facts and provide source references'}
        ]
      }
    },
    input:{},
    model_name:'pro'
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
  const MAX_RESEARCH_CHARS=24000;
  const MAX_SOURCES=30;
  const compactAnswer=answer.trim().slice(0,MAX_RESEARCH_CHARS);
  const compactSources=[...new Set(sources)].slice(0,MAX_SOURCES);
  if(answer.trim().length>MAX_RESEARCH_CHARS){
    console.log('Bigdata research compacted from',answer.trim().length,'to',compactAnswer.length,'characters');
  }
  return {answer:compactAnswer,sources:compactSources};
}

const research=await bigdataResearch();

const editorialSchema={
  type:'object',
  additionalProperties:false,
  required:['summary','markets','drivers','sections','agenda','sources'],
  properties:{
    summary:{type:'string'},
    markets:{type:'array',minItems:4,maxItems:12,items:{type:'object',additionalProperties:false,required:['name','value'],properties:{name:{type:'string'},value:{type:'string'}}}},
    drivers:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,required:['title','number','reason','impact'],properties:{title:{type:'string'},number:{type:'string'},reason:{type:'string'},impact:{type:'string'}}}},
    sections:{type:'array',minItems:4,maxItems:8,items:{type:'object',additionalProperties:false,required:['title','items'],properties:{title:{type:'string'},items:{type:'array',minItems:1,maxItems:8,items:{type:'string'}}}}},
    agenda:{type:'array',maxItems:12,items:{type:'object',additionalProperties:false,required:['name','officialDate','timeNewYork','timeMadrid','status','consensus','previous','result'],properties:{name:{type:'string'},officialDate:{type:'string'},timeNewYork:{type:'string'},timeMadrid:{type:'string'},status:{type:'string',enum:['FUTURO','JÁ DIVULGADO']},consensus:{type:'string'},previous:{type:'string'},result:{type:'string'}}}},
    sources:{type:'array',minItems:2,maxItems:30,items:{type:'string'}}
  }
};
const system=`You are PrimeSphere Intelligence's financial editor. Return ONLY valid JSON matching Editorial Edition V2. Audience: Brazilians following US markets. Never invent data. Use only the supplied Bigdata research pack. Edition date must be ${iso}. For economic agenda include ONLY events whose official date is exactly ${iso}; require New York time, Madrid conversion, status, consensus and previous. If any is missing or ambiguous, exclude it. For released events require result. Exactly 3 drivers using NÚMERO/MOTIVO/IMPACTO. kind=${kind}. schemaVersion=2. date=${code}. Required sections for morning: Market Pulse, Premarket Movers, Earnings Radar, Market Themes, Brasil → EUA, O que observar hoje. Required sections for afterclose: Market Pulse, Destaques do fechamento, Earnings Radar, Market Themes, Brasil → EUA, O que observar amanhã. sources must contain at least two identifiable source names/references from the supplied research. updatedAtMadrid must be a real Europe/Madrid timestamp. Do not silently convert stale or previous-session data into current data.`;

const user=JSON.stringify({date:iso,kind,bigdataResearch:research});
const estimatedInputTokens=Math.ceil((system.length+user.length)/4);
const MAX_ESTIMATED_INPUT_TOKENS=12000;
if(estimatedInputTokens>MAX_ESTIMATED_INPUT_TOKENS){
  throw new Error(`OpenAI cost guard: estimated input ${estimatedInputTokens} tokens exceeds ${MAX_ESTIMATED_INPUT_TOKENS}; request not sent`);
}
console.log('OpenAI cost guard: estimated input tokens',estimatedInputTokens,'model',process.env.OPENAI_MODEL||'gpt-5.6-luna');
const r=await fetch('https://api.openai.com/v1/responses',{
  method:'POST',
  headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({
    model:process.env.OPENAI_MODEL||'gpt-5.6-luna',
    input:[{role:'system',content:system},{role:'user',content:user}],
    text:{format:{type:'json_schema',name:'prime_sphere_editorial_v2',strict:true,schema:editorialSchema}},
    store:false
  })
});
if(!r.ok) throw new Error('OpenAI request failed '+r.status+' '+await r.text());
const data=await r.json();
const raw=data.output_text ?? data.output?.flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text;
if(!raw) throw new Error('OpenAI returned no JSON');
const edition=JSON.parse(raw);
edition.schemaVersion=2;
edition.date=code;
edition.kind=kind;
// Structural metadata is deterministic and must never depend on model compliance.
edition.label=kind==='morning'?'Morning Brief':'After Market';
edition.title=kind==='morning'?'Morning Brief — PrimeSphere Intelligence':'After Market — PrimeSphere Intelligence';
edition.updatedAtMadrid=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace(' ','T');
const suffix=kind==='afterclose'?'-afterclose':'';
await fs.writeFile(`src/react-app/editions/${code}${suffix}.json`,JSON.stringify(edition,null,2)+'\n');
console.log('Generated',code,kind,'from Bigdata Research Workflow');
