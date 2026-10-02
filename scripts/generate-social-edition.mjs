import fs from "node:fs/promises";
import path from "node:path";
const [,, source, output] = process.argv;
if (!source || !output) throw new Error("Usage: node generate-social-edition.mjs edition.tsx output.json");
const raw=await fs.readFile(source,"utf8"), code=path.basename(source).match(/^(\d{6})\.tsx$/)?.[1];
if(!code) throw new Error("Morning Brief filename must be YYMMDD.tsx");
const edition=`20${code.slice(0,2)}-${code.slice(2,4)}-${code.slice(4,6)}`, dmY=`${code.slice(4,6)}/${code.slice(2,4)}/20${code.slice(0,2)}`;
const plain=s=>String(s).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const boxes=[...raw.matchAll(/<Box title="([^"]+)">([\s\S]*?)<\/Box>/g)].map(m=>({title:m[1],body:plain(m[2])}));
const section=title=>{const x=boxes.find(b=>b.title===title);if(!x)throw Error("Missing Morning Brief section: "+title);return x.body};
const header=raw.match(/<p className="mt-4 text-lg leading-8">([\s\S]*?)<\/p>/)?.[1]; if(!header)throw Error("Missing Morning Brief summary");
const pairs=[...section("Wall Street em 30 segundos").matchAll(/(?:^|\s)(S&P 500 futuro|Nasdaq 100 futuro|Dow futuro|Russell 2000 futuro|VIX|Treasury 10 anos|WTI|Ouro|Bitcoin|USD\/BRL)\s+([^\s]+(?:\s+\d[\d.,]*\s*(?:mil)?)?)/g)].map(m=>[m[1],m[2]]);
const rawPairs=[...raw.matchAll(/\['([^']+)','([^']+)'\]/g)].slice(0,10).map(m=>[m[1],m[2]]);
const snap=rawPairs.length===10?rawPairs:pairs;if(snap.length!==10)throw Error("Snapshot must contain exactly 10 instruments");
const drivers=boxes.filter(b=>/^0[123]\s*·/.test(b.title)).slice(0,3);if(drivers.length!==3)throw Error("Morning Brief requires 3 numbered drivers");
const short=(s,n=205)=>s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,"")+"…";
const footer=`${code.slice(4,6)} ${["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][Number(code.slice(2,4))-1]} 20${code.slice(0,2)} • @portfoliointelligence`;
const pct=v=>{const m=String(v).match(/([+-])\s*([\d,.]+)%/);return m?m[1]+m[2]+"%":"—"};
const reading=v=>{const p=pct(v);if(p==="—")return "NEUTRO";const n=parseFloat(p.replace("%","").replace(",", "."));return n>=0.35?"POSITIVO":n>0?"NEUTRO/+":n<=-0.35?"NEGATIVO":"NEUTRO/-"};
const marketRows=snap.map(([n,v])=>({ticker:n.replace(" futuro","").replace("Treasury 10 anos","10Y"),price:String(v),change:pct(v),reading:reading(v)}));
const movers=section("Premarket Movers"), agenda=section("Agenda do dia"), earnings=section("Earnings Radar"), watch=section("O que observar hoje");
const cards=[
 {background:29,layout:"cover",eyebrow:"PRIMESPHERE INTELLIGENCE",title:"Wall Street",accent:"ANTES DA ABERTURA",body:short(plain(header),155),footer},
 {background:30,layout:"market",eyebrow:"WALL STREET EM 30 SEGUNDOS",title:"Mercado agora",accent:"SNAPSHOT",body:"",marketRows,footer:"Preço • variação • leitura"},
 {background:31,layout:"drivers",eyebrow:"AS 3 COISAS DO DIA",title:"O que move o mercado",accent:"FOCO DO MERCADO",body:drivers.map((x,i)=>`${i+1}. ${x.title.replace(/^0[123]\s*·\s*/,"")} — ${short(x.body,105)}`).join("\n"),footer:"Número → motivo → impacto"},
 {background:32,layout:"list",eyebrow:"PREMARKET MOVERS",title:"Quem está se mexendo",accent:"MOVERS",body:short(movers,310),footer:"Catalisadores do Morning Brief"},
 {background:33,layout:"list",eyebrow:"AGENDA",title:"O relógio do mercado",accent:"HOJE",body:short(agenda,300),footer:"Horários de Madrid"},
 {background:34,layout:"feature",eyebrow:"EARNINGS RADAR",title:"Resultados no radar",accent:"EARNINGS",body:short(earnings,260),footer:"PrimeSphere Intelligence"},
 {background:35,layout:"list",eyebrow:"O QUE OBSERVAR",title:"Radar da sessão",accent:"RADAR",body:short(watch,285),footer:"PrimeSphere Intelligence"},
 {background:36,layout:"cta",eyebrow:"PRIMESPHERE INTELLIGENCE",title:"Contexto antes do ruído",accent:"PRIMESPHEREINTELLIGENCE.COM",body:"Morning Brief completo no site. Informação, contexto e leitura de mercado antes da abertura.",footer:"@portfoliointelligence"}
];
const caption=`Morning Brief PrimeSphere — ${dmY}. ${short(plain(header),300)}\n\nConteúdo informativo e educacional. Não constitui recomendação individual de investimento.\n\n#WallStreet #Mercados #Investimentos #PrimeSphere #PortfolioIntelligence`;
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify({edition,templateVersion:"approved-v1",caption,cards},null,2)+"\n");console.log("Generated social JSON:",edition,"template approved-v1");