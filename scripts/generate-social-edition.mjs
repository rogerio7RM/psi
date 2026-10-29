import fs from "node:fs/promises";
import path from "node:path";
const [,,source,output]=process.argv;
if(!source||!output)throw Error("Usage: generate source.json output.json");
const data=JSON.parse(await fs.readFile(source,"utf8"));
const code=path.basename(source).match(/^(\d{6})\.json$/)?.[1];
if(!code||data.kind!=="morning"||String(data.date)!==code)throw Error("Expected matching Morning Brief JSON");
const edition=`20${code.slice(0,2)}-${code.slice(2,4)}-${code.slice(4,6)}`;
const short=(s,n)=>{s=String(s||"").trim();return s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,"")+"…"};
const section=t=>data.sections?.find(s=>s.title===t)?.items||[];
const join=(arr,n)=>short(arr.join(" • "),n);
const mon=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const footer=`${code.slice(4,6)} ${mon[Number(code.slice(2,4))-1]} 20${code.slice(0,2)} • @portfoliointelligence`;
const reading=v=>{const n=Number(String(v).replace("%","").replace(",",".").replace(/[^\d.+-]/g,""));return !Number.isFinite(n)?"NEUTRO":n>=.35?"POSITIVO":n>0?"NEUTRO/+":n<=-.35?"NEGATIVO":n<0?"NEUTRO/-":"NEUTRO"};
const marketRows=(data.markets||[]).filter(x=>x.name&&x.value).slice(0,10).map(x=>({ticker:x.name.replace(" FUTUROS",""),change:x.value,reading:reading(x.value)}));
if(!marketRows.length)throw Error("No market data in Morning Brief");
const drivers=(data.drivers||[]).slice(0,3).map(x=>({title:short(x.title||x.reason,37),text:short(x.impact,155)}));
if(drivers.length!==3)throw Error("Missing three drivers");
const cards=[
{id:"cover",background:29,title:"WALL STREET",subtitle:"ANTES DA ABERTURA",body:short(data.summary,180),footer},
{id:"highlights",background:30,title:"DESTAQUES DO DIA",subtitle:"FUTUROS • VARIAÇÃO • LEITURA",marketRows,footer},
{id:"agenda",background:31,title:"AGENDA DO DIA",subtitle:"EVENTOS CONFIRMADOS",body:data.agenda?.length?join(data.agenda.map(x=>typeof x==="string"?x:JSON.stringify(x)),420):"Sem eventos com data e horário verificados nesta edição.",footer},
{id:"pulse",background:32,title:"MARKET PULSE",subtitle:"3 LEITURAS PARA A ABERTURA",blocks:drivers,footer},
{id:"radar",background:33,title:"RADAR",subtitle:"O QUE OBSERVAR HOJE",body:join(section("O que observar hoje"),430)||"Acompanhe a evolução dos índices e da volatilidade.",footer},
{id:"earnings",background:34,title:"EARNINGS RADAR",subtitle:"RESULTADOS E EXPECTATIVAS",body:join(section("Earnings Radar"),360)||"Sem resultados verificados nesta edição.",footer},
{id:"brasil",background:35,title:"BRASIL → WALL STREET",subtitle:"INVESTIDOR BRASILEIRO",body:join(section("Brasil → EUA"),360)||"Sem movimentos confirmados nesta edição.",footer},
{id:"cta",background:36,title:"CONTEXTO ANTES DO RUÍDO",subtitle:"PRIMESPHERE INTELLIGENCE",body:"Morning Brief completo em primesphereintelligence.com. Conteúdo informativo e educacional. Não constitui recomendação individual de investimento.",footer}
];
const caption=`Morning Brief PrimeSphere — ${code.slice(4,6)}/${code.slice(2,4)}/20${code.slice(0,2)}. ${short(data.summary,320)}\n\nLeia: primesphereintelligence.com\n\nConteúdo educacional, não é recomendação individual de investimento.\n\n#WallStreet #Mercados #Investimentos #PrimeSphere #PortfolioIntelligence`;
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({edition,templateVersion:"primesphere-approved-v2",cards,caption},null,2)+"\n");
console.log("Generated",edition,"from JSON",marketRows.length,"market rows");
