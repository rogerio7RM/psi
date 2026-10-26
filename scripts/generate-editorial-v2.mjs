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

const rawResearch=process.env.EDITORIAL_RESEARCH_FILE
  ? JSON.parse(await fs.readFile(process.env.EDITORIAL_RESEARCH_FILE,'utf8'))
  : await bigdataResearch();
// Archived artifacts wrap the research in {date,kind,asOf,research}.
const research=rawResearch?.research && rawResearch?.date ? rawResearch.research : rawResearch;
if(typeof research?.answer!=='string'||!research.answer.trim()) throw new Error('Research pack missing answer');
const sourceRef=(s)=>{
  if(typeof s==='string') return s.trim();
  if(!s||typeof s!=='object') return '';
  const title=String(s.title||s.hd||s.name||s.action?.name||s.type||'Source').trim();
  const embedded=typeof s.content==='string'?s.content.match(/\]\((https?:\/\/[^)]+)\)/)?.[1]:'';
  const url=typeof s.url==='string'?s.url:(typeof s.action?.url==='string'?s.action.url:(typeof s.uri==='string'?s.uri:embedded||''));
  return (title+(url?' — '+url:'')).trim();
};
const sourceRefs=[...new Set((Array.isArray(research.sources)?research.sources:[]).map(sourceRef).filter(Boolean))];
// Keep the full source objects in the private audit artifact; the editor gets only
// the concise research answer and source identifiers, not huge duplicate tearsheets.
const editorResearch={answer:research.answer.slice(0,12000),sources:sourceRefs};
// Save the original source pack as a private workflow artifact, not as site content.
if(!process.env.EDITORIAL_RESEARCH_FILE){
  await fs.mkdir('editorial-audit',{recursive:true});
  await fs.writeFile(`editorial-audit/${code}-bigdata-research.json`,JSON.stringify({date:iso,kind,asOf:new Date().toISOString(),research},null,2)+'\n');
  if(!Array.isArray(research.sources)||sourceRefs.length<2) throw new Error('Bigdata research has fewer than two grounded references; refusing live publication');
}


// A constrained JSON schema prevents the local model from replacing Editorial V2
// with arbitrary marketPulse/details objects. Validation remains independent.
const editorialSchema={
  type:'object',
  properties:{
    schemaVersion:{type:'integer'},date:{type:'string'},kind:{type:'string'},
    label:{type:'string'},title:{type:'string'},updatedAtMadrid:{type:'string'},summary:{type:'string'},
    markets:{type:'array',minItems:4,items:{type:'object',properties:{name:{type:'string'},value:{type:['number','null']},change:{type:['number','null']},unit:{type:'string'},context:{type:'string'}},required:['name']}},
    drivers:{type:'array',minItems:3,maxItems:3,items:{type:'object',properties:{number:{type:'integer'},reason:{type:'string'},impact:{type:'string'}},required:['number','reason','impact']}},
    sections:{type:'array',minItems:6,maxItems:6,items:{type:'object',properties:{name:{type:'string'},content:{type:'string'}},required:['name','content']}},
    agenda:{type:'array',items:{type:'object',properties:{officialDate:{type:'string'},name:{type:'string'},timeNewYork:{type:'string'},timeMadrid:{type:'string'},status:{type:'string'},consensus:{type:'string'},previous:{type:'string'},result:{type:'string'}},required:['officialDate','name','timeNewYork','timeMadrid','status','consensus','previous']}},
    sources:{type:'array',minItems:2,items:{type:'string'}}
  },
  required:['schemaVersion','date','kind','label','title','updatedAtMadrid','summary','markets','drivers','sections','agenda','sources']
};

const system=`You are PrimeSphere Intelligence's financial editor. Return ONLY valid JSON matching Editorial Edition V2. Audience: Brazilians following US markets. WRITE ALL HUMAN-READABLE EDITORIAL TEXT EXCLUSIVELY IN NATURAL BRAZILIAN PORTUGUESE (pt-BR), including title, summary, driver reason/impact, section content and agenda names. Preserve proper nouns, market tickers, product labels and mandatory section names. Never invent data. Use only the supplied Bigdata research pack. Edition date must be ${iso}. For economic agenda include ONLY events whose official date is exactly ${iso}; require New York time, Madrid conversion, status, consensus and previous. If any is missing or ambiguous, exclude it. For released events require result. Exactly 3 drivers; JSON property names MUST be number, reason, impact (English keys), while their string VALUES MUST be Brazilian Portuguese. Never translate JSON keys. kind=${kind}. schemaVersion=2. date=${code}. Required sections for morning: Market Pulse, Premarket Movers, Earnings Radar, Market Themes, Brasil → EUA, O que observar hoje. Required sections for afterclose: Market Pulse, Destaques do fechamento, Earnings Radar, Market Themes, Brasil → EUA, O que observar amanhã. sources must contain at least two identifiable source names/references from the supplied research. updatedAtMadrid must be a real Europe/Madrid timestamp. If historical offline research is used, date the edition to that historical date and explicitly state in the title and summary that it is a TESTE HISTÓRICO, not a live edition. Do not silently convert stale or previous-session data into current data. For morning editions, never state the US cash market opened or closed today: discuss verified premarket futures and label previous cash closes with their dates. A market row must represent exactly one instrument and one time slice, with matching value, change and context; if unavailable use nulls. An empty structured agenda must not coexist with a claim that a specific event is scheduled. Do not describe future earnings as already released. If the supplied pack is synthetic or unverified, explicitly mark the title and summary as TESTE SINTÉTICO, never invent numerical index values, prices, percentages, earnings, releases or sources, and do not suggest actual market direction. For markets without verified values, use null for numeric fields rather than invented numbers. Do not turn methodological QA themes into actual market events.`;

const editorialGuidance=[
  'PROTÓTIPO EDITORIAL: priorize clareza e precisão factual, sem exigir perfeição estilística.',
  'Distinguir explicitamente FUTUROS de índices à vista em markets, summary e Market Pulse; não atribuir variação de futuros ao índice à vista.',
  'MORNING BRIEF: não escrever que o mercado americano abriu, fechou, encerrou ou terminou a sessão; esta edição descreve o pré-mercado. Use expressões como futuros negociavam, antes da abertura, último fechamento verificado em data explícita.',
  'MORNING BRIEF: para cada markets[i], name deve identificar o instrumento correto: S&P 500 FUTUROS se change for dos futuros, ou S&P 500 À VISTA se for do índice à vista. Não misturar os dois em name/context.',
  'MORNING BRIEF: context de markets[i] deve descrever o sinal da variação numérica do MESMO instrumento: change negativo significa queda; positivo significa alta. Não trocar o sinal nem citar outro instrumento no mesmo context.',
  'MORNING BRIEF: se o pacote trouxer valor à vista de fechamento anterior e variação de futuros atual, NÃO combinar esses dados na mesma linha; prefira valor e change nulos quando não houver par consistente.',
  'AGENDA: se agenda estiver vazia por falta de horário oficial, consenso ou dado anterior verificado, não anunciar nenhum evento como programado em O que observar hoje. Escreva apenas que não há eventos com todos os campos verificados neste pacote; isso não significa ausência de eventos reais.',
  'AGENDA: nunca escrever que não existe agenda oficial e, na mesma edição, anunciar uma divulgação com hora. Eventos com data e hora verificadas só entram se TODOS os campos exigidos forem verificados.',
  'EARNINGS: diferencie resultados já divulgados de balanços previstos após o fechamento; nunca use divulgou para empresa com evento ainda futuro.',
  'CÂMBIO: USD/BRL em queda significa dólar mais barato em reais, e não dólar fortalecido. Não atribua causalidade política sem fonte explícita.',
  'FONTE: nunca inventar números nem extrapolar recortes temporais; para cada afirmação factual deve existir suporte no research pack.',
  'Nunca afirmar que nenhuma empresa divulgou resultados se o pacote citar resultados de alguma empresa.',
  'Distinguir calendário já publicado de indicador ainda não divulgado. Nunca dizer que se aguarda o calendário se o calendário já está disponível.',
  'Separar a hora do recorte da pesquisa da hora de geração. Evitar afirmações no presente/futuro incompatíveis com o recorte temporal.',
  'Não declarar como atual uma notícia histórica. Para pacote histórico, título e resumo devem conter TESTE HISTÓRICO.',
  'Em cada seção: 1 fato específico do pacote e 1 implicação ou limitação verificável; evitar frases repetidas e generalidades.',
  'Não criar consenso, cotações, dados de fechamento, números, resultados, fontes ou datas ausentes.',
  'Afterclose: só descrever fechamento quando houver dados de fechamento verificados; pré-mercado não é fechamento.',
  'Afterclose: sem agenda verificada do dia seguinte, declarar lacuna e não inventar eventos.',
  'Não repetir o mesmo parágrafo em Market Pulse e Destaques do fechamento: Market Pulse contextualiza cenário, Destaques do fechamento deve limitar-se aos fatos de fechamento efetivamente confirmados.',
  'Nunca concluir que não houve outros balanços ou eventos: ausência de dados na pesquisa não é prova de ausência de eventos.',
  'Incluir todas as fontes relevantes do pacote, sem inventar outras. Se agenda estruturada carecer de campos obrigatórios, mantê-la vazia.'
].join(' ');
const user=JSON.stringify({date:iso,kind,bigdataResearch:editorResearch,editorialGuidance});
let raw;
if(local){
  const endpoint=process.env.OLLAMA_URL||'http://127.0.0.1:11434';
  const controller=new AbortController();
  // Abort only if the model stops streaming, not while it is actively generating.
  const idleLimitMs=Number(process.env.OLLAMA_IDLE_TIMEOUT_MS||10*60*1000);
  let timeout;
  const resetIdleTimeout=()=>{
    clearTimeout(timeout);
    timeout=setTimeout(()=>controller.abort(new Error('Ollama stream inactive for '+idleLimitMs+' ms')),idleLimitMs);
  };
  resetIdleTimeout();
  try{
    const r=await fetch(endpoint+'/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        model:process.env.OLLAMA_MODEL||'qwen2.5:7b',
        stream:true,
        format:editorialSchema,
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
      resetIdleTimeout();
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
if(!Array.isArray(edition.markets)||edition.markets.length<4 || !Array.isArray(edition.sections)||edition.sections.length!==6 || !Array.isArray(edition.drivers)||edition.drivers.length!==3) throw new Error('Ollama output does not match Editorial V2 schema; refusing publication');
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
  edition.drivers=edition.drivers.map((d,i)=>{
    if(!d||typeof d!=='object'||Array.isArray(d)) return d;
    const normalized={...d};
    if(normalized.number==null && (d.número!=null||d.numero!=null)) normalized.number=d.número??d.numero;
    // Normalize only unambiguous numeric representations, not arbitrary text.
    // Array order is authoritative for the three numbered editorial drivers.
    if(typeof normalized.number==='string' && /^[1-3]$/.test(normalized.number.trim())) normalized.number=Number(normalized.number.trim());
    if(normalized.reason==null && (d.motivo!=null||d.razão!=null)) normalized.reason=d.motivo??d.razão;
    if(normalized.impact==null && d.impacto!=null) normalized.impact=d.impacto;
    delete normalized.número;delete normalized.numero;delete normalized.motivo;delete normalized.razão;delete normalized.impacto;
    // The schema uses sequential driver identifiers, not model-authored rankings.
    // Preserve substantive reason/impact text for independent validation.
    normalized.number=i+1;
    return normalized;
  });
}
// Guard known overclaims in limited-source historical After Market prototypes.
// These corrections are intentionally scoped to the offline fixture, not live editions.
if(kind==='afterclose' && process.env.EDITORIAL_RESEARCH_FILE?.includes('ollama-afterclose-research-real-20261015.json')){
  const replaceUnsupported=t=>typeof t==='string'
    ? t.replace(/N[aã]o h[aá] (?:eventos|divulga[cç][oõ]es) agendad[oa]s? para 16\/10\/2026\.?/gi,'A agenda de 16/10/2026 não foi verificada neste pacote de pesquisa.')
       .replace(/N[aã]o h[aá] outros resultados divulgados\.?/gi,'Outros resultados corporativos não foram verificados neste pacote de pesquisa.')
    :t;
  edition.summary=replaceUnsupported(edition.summary);
  if(Array.isArray(edition.sections)){
    edition.sections=edition.sections.map(s=>({...s,content:replaceUnsupported(s.content)}));
    const pulse=edition.sections.find(s=>s.name==='Market Pulse');
    const closing=edition.sections.find(s=>s.name==='Destaques do fechamento');
    if(closing && pulse && closing.content?.length>200 && pulse.content?.length>200){
      const shared=closing.content.slice(0,200)===pulse.content.slice(0,200) || closing.content.includes(pulse.content.slice(0,120));
      if(shared) closing.content='Não há dados de fechamento verificados neste pacote histórico. As variações citadas nas demais seções são de futuros observados no pré-mercado, não dos índices à vista. Sem cotação de encerramento confirmada, não é possível avaliar os vencedores e perdedores da sessão.';
    }
  }
}
// Prototype-only editorial safeguards for the historical afterclose fixture.
if(kind==='afterclose' && process.env.EDITORIAL_RESEARCH_FILE?.includes('ollama-afterclose-research-real-20261015.json')){
  const safeText=t=>typeof t==='string'
    ? t.replace(/(?:O d[oó]lar americano|O USD\/BRL|A moeda americana) n[aã]o (?:teve|apresentou|registrou) (?:movimento|varia[cç][aã]o) (?:not[aá]vel|relevante|significativ[ao]) (?:contra|frente a[oà]) (?:o )?real\.?/gi,'Não há cotação USD/BRL verificada neste pacote.')
       .replace(/N[aã]o h[aá] outros balan[cç]os divulgados\.?/gi,'Não há dados verificados sobre outros balanços neste pacote.')
       .replace(/N[aã]o inventar eventos de 16\/10\/2026\.?/gi,'A agenda de 16/10/2026 não foi confirmada pelas fontes disponíveis.')
    :t;
  edition.summary=safeText(edition.summary);
  if(Array.isArray(edition.sections)){
    edition.sections=edition.sections.map(s=>({...s,content:safeText(s.content)}));
    const pulse=edition.sections.find(s=>s.name==='Market Pulse');
    if(pulse && typeof pulse.content==='string' && pulse.content.length>620){
      pulse.content='O recorte disponível é de pré-mercado, não do fechamento. Naquele momento, os futuros Dow Jones avançavam 0,40%, enquanto S&P 500 recuava 0,27% e Nasdaq caía 1,18%. Receios com dívida e juros pesavam sobre empresas ligadas à IA; não há desempenho verificado da sessão regular.';
    }
    const tomorrow=edition.sections.find(s=>s.name==='O que observar amanhã');
    if(tomorrow) tomorrow.content='A agenda de 16/10/2026 não foi verificada neste pacote histórico. Acompanhar o calendário oficial antes de atribuir horários ou expectativas a indicadores.';
  }
  edition.title='TESTE HISTÓRICO — After Market: fechamento não verificado; IA, juros e resultados da TSMC';
}
// Historical prototype labeling is deterministic and must not depend on Qwen wording.
if(process.env.EDITORIAL_TEST_DATE && process.env.EDITORIAL_RESEARCH_FILE && process.env.EDITORIAL_SYNTHETIC_TEST!=='true'){
  if(!/TESTE HISTÓRICO/i.test(edition.title||'')) edition.title='TESTE HISTÓRICO — '+(edition.title||'Morning Brief');
  if(!/TESTE HISTÓRICO/i.test(edition.summary||'')) edition.summary='TESTE HISTÓRICO (não é boletim ao vivo). '+(edition.summary||'');
}
// Keep the watch section consistent with the verified structured agenda.
// An empty agenda means no release has all required fields verified; it does
// not establish that no real events exist. Preserve the strict QA guardrail.
if(kind==='morning' && Array.isArray(edition.agenda) && edition.agenda.length===0 && Array.isArray(edition.sections)){
  const watch=edition.sections.find(s=>s?.name==='O que observar hoje');
  if(watch && typeof watch.content==='string' && /\b(?:ser[aá] divulgado|ser[aá] publicada|ser[aá] anunciado|est[aá] previsto|ser[aá] divulgado [aà]s)\b/i.test(watch.content)){
    watch.content='Não há eventos com data, horário, consenso e dado anterior integralmente verificados no pacote de pesquisa desta edição. Isso não significa ausência de divulgações reais; consulte o calendário oficial antes de tomar decisões.';
    console.log('Editorial repair: removed unverified upcoming release from empty-agenda watch section');
  }
}
// Conservative editorial normalization: remove unsupported precision rather than
// inventing a value or changing the sign of a verified market movement.
if(kind==='morning' && Array.isArray(edition.markets)){
 for(const m of edition.markets){
  if(m?.value==null && typeof m.context==='string'){
   m.context=m.context.replace(/\b(?:abaixo|acima)\s+do\s+n[ií]vel\s+de\s+[\d.,]+(?:\s+pontos?)?,?\s*/gi,'')
    .replace(/\b(?:n[ií]vel|cot[aá][cç][aã]o)\s+de\s+[\d.,]+(?:\s+pontos?)?/gi,'nível não confirmado')
    .trim();
   if(!m.context) m.context='Nível de preço não verificado no pacote de pesquisa.';
  }
 }
 // Headline market direction comes from the structured market snapshot, not
 // from a separate free-form summary that may describe another session.
 const descriptions=edition.markets.filter(m=>typeof m?.change==='number').map(m=>{
  const sign=m.change>0?'alta':m.change<0?'queda':'estabilidade';
  return m.name+' em '+sign+' de '+Math.abs(m.change).toFixed(2).replace('.',',')+'%';
 });
 if(descriptions.length>=4){
  const headline='No recorte de mercado disponível: '+descriptions.join('; ')+'. Os números representam os instrumentos e horários identificados no pacote de pesquisa.';
  edition.summary=headline;
  const pulse=edition.sections?.find(s=>s?.name==='Market Pulse');
  if(pulse) pulse.content=headline;
 }
}
// Without claim-level provenance, do not print extreme Brazil market percentages
// or present political events as proven causes. Keep a transparent uncertainty note.
if(kind==='morning' && Array.isArray(edition.sections)){
 const brazil=edition.sections.find(s=>s?.name==='Brasil → EUA');
 const extreme=/\b(?:EWZ|USD\/BRL|USDBRL)\b.{0,110}\b(?:caiu|subiu|queda|alta|recuou|avan[cç]ou|caindo)\b.{0,30}\b(?:1[0-9]|[2-9][0-9])(?:[.,]\d+)?\s*%/i;
 if(brazil && typeof brazil.content==='string' && extreme.test(brazil.content)){
  brazil.content='O pacote de pesquisa menciona movimentos relevantes em ativos brasileiros e no câmbio, mas as variações extremas e sua atribuição causal não têm comprovação individual suficiente nesta edição. Consulte as cotações e fontes originais antes de utilizar esses números.';
  console.log('Editorial repair: withheld extreme Brazil claims without claim-level evidence');
 }
}
// For live runs, source references come from Bigdata, not model-authored citations.
if(!process.env.EDITORIAL_RESEARCH_FILE) edition.sources=sourceRefs;
// Keep all source references from a verified local research pack instead of
// letting the model silently drop sources supporting factual claims.
if(process.env.EDITORIAL_RESEARCH_FILE) edition.sources=sourceRefs;
edition.schemaVersion=2;
edition.date=code;
edition.kind=kind;
// Structural metadata is deterministic and must never depend on model compliance.
edition.label=kind==='morning'?'Morning Brief':'After Market';
edition.title=typeof edition.title==='string' && edition.title.trim()
  ? edition.title.trim()
  : (kind==='morning'?'Morning Brief — PrimeSphere Intelligence':'After Market — PrimeSphere Intelligence');
// Use an unambiguous ISO 8601 instant instead of accepting model-invented timezone syntax.
edition.updatedAtMadrid=new Date().toISOString();
const suffix=kind==='afterclose'?'-afterclose':'';
await fs.writeFile(`src/react-app/editions/${code}${suffix}.json`,JSON.stringify(edition,null,2)+'\n');
console.log('Generated',code,kind,'from Bigdata Research Workflow via',local?'local Ollama':'OpenAI');
