import fs from "node:fs/promises";import path from "node:path";
const [,,source,output]=process.argv;if(!source||!output)throw Error("Usage: generate source output");
const raw=await fs.readFile(source,"utf8"),code=path.basename(source).match(/^(\d{6})\.tsx$/)?.[1];if(!code)throw Error("bad edition");
const edition=`20${code.slice(0,2)}-${code.slice(2,4)}-${code.slice(4,6)}`,plain=s=>String(s).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const boxes=[...raw.matchAll(/<Box title="([^"]+)">([\s\S]*?)<\/Box>/g)].map(m=>({title:m[1],body:plain(m[2])})),sec=t=>{const x=boxes.find(b=>b.title===t);if(!x)throw Error("Missing section "+t);return x.body};
const header=plain(raw.match(/<p className="mt-4 text-lg leading-8">([\s\S]*?)<\/p>/)?.[1]||"");if(!header)throw Error("Missing summary");
const rawPairs=[...raw.matchAll(/\['([^']+)','([^']+)'\]/g)].slice(0,10).map(m=>[m[1],m[2]]);if(rawPairs.length!==10)throw Error("Need 10 market rows");
const pct=v=>{const m=String(v).match(/([+-])\s*([\d,.]+)%/);return m?m[1]+m[2]+"%":"—"},reading=v=>{const p=pct(v);if(p==="—")return "NEUTRO";const n=parseFloat(p.replace("%","").replace(",","."));return n>=.35?"POSITIVO":n>0?"NEUTRO/+":n<=-.35?"NEGATIVO":"NEUTRO/-"};
const marketRows=rawPairs.map(([n,v])=>({ticker:n.replace(" futuro","").replace("Treasury 10 anos","10Y"),price:String(v),change:pct(v),reading:reading(v)}));
const splitItems=s=>String(s).split(/(?=\b(?:\d{1,2}:\d{2}|Macro:|Earnings:|Fed:|Brasil:))/i).map(x=>x.trim()).filter(Boolean).slice(0,6);
const agendaItems=splitItems(sec("Agenda do dia"));
const brasilText=sec("Brasil → EUA"), brasilParts=brasilText.split(/(?<=[.!?])\s+/).filter(Boolean);
const brasilBlocks=[
 {title:"CÂMBIO",text:short(brasilParts.slice(0,2).join(" "),180)},
 {title:"JUROS",text:short(brasilParts.slice(2,4).join(" ")||brasilText,180)},
 {title:"LEITURA DO DIA",text:short(brasilParts.slice(4).join(" ")||brasilText,190)}
];
const drivers=boxes.filter(b=>/^0[123]\s*·/.test(b.title)).slice(0,3);if(drivers.length!==3)throw Error("Need exactly 3 drivers");
const short=(s,n)=>s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,"")+"…",mon=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"],footer=`${code.slice(4,6)} ${mon[+code.slice(2,4)-1]} 20${code.slice(0,2)} • @portfoliointelligence`;
const cards=[
{id:"cover",background:29,title:"WALL STREET",subtitle:"ANTES DA ABERTURA",body:short(header,180),footer},
{id:"highlights",background:30,title:"DESTAQUES DO DIA",subtitle:"PREÇO • VARIAÇÃO • LEITURA",marketRows,footer},
{id:"agenda",background:31,title:"AGENDA DO DIA",subtitle:"MACRO • FED • EARNINGS",items:agendaItems,footer},
{id:"pulse",background:32,title:"MARKET PULSE",subtitle:"3 LEITURAS PARA A ABERTURA",blocks:drivers.map(x=>({title:x.title.replace(/^0[123]\s*·\s*/,""),text:short(x.body,155)})),footer},
{id:"radar",background:33,title:"RADAR",subtitle:"O QUE OBSERVAR HOJE",body:short(sec("O que observar hoje"),430),footer},
{id:"earnings",background:34,title:"EARNINGS RADAR",subtitle:"RESULTADOS • GUIDANCE • CATALISADORES",body:short(sec("Earnings Radar"),360),footer},
{id:"brasil",background:35,title:"BRASIL → WALL STREET",subtitle:"CÂMBIO E JUROS PARA O INVESTIDOR BRASILEIRO",metrics:marketRows.filter(r=>["USD/BRL","10Y","DXY","EWZ"].some(k=>r.ticker.toUpperCase().includes(k))).slice(0,4),blocks:brasilBlocks,footer},
{id:"cta",background:36,title:"CONTEXTO ANTES DO RUÍDO",subtitle:"PRIMESPHERE INTELLIGENCE",body:"Morning Brief completo em primesphereintelligence.com. Conteúdo informativo e educacional. Não constitui recomendação individual de investimento.",footer}
];
const caption=`Morning Brief PrimeSphere — ${code.slice(4,6)}/${code.slice(2,4)}/20${code.slice(0,2)}. ${short(header,320)}\n\nConteúdo informativo e educacional. Não constitui recomendação individual de investimento.\n\n#WallStreet #Mercados #Investimentos #PrimeSphere #PortfolioIntelligence`;
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify({edition,templateVersion:"primesphere-editorial-v3",cards,caption},null,2)+"\n");console.log("Generated",edition,"primesphere-editorial-v3");