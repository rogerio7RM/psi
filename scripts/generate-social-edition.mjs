import fs from "node:fs/promises";
import path from "node:path";
const [,,source,output]=process.argv;
if(!source||!output)throw Error("Usage: generate source.json output.json");
const data=JSON.parse(await fs.readFile(source,"utf8"));
const code=path.basename(source).match(/^(\d{6})\.json$/)?.[1];
if(!code||data.kind!=="morning"||String(data.date)!==code)throw Error("Expected matching Morning Brief JSON");
const editorial=[data.summary,...(data.sections||[]).flatMap(s=>[s.content,...(s.items||[])])].filter(v=>typeof v==="string").join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
if(/\b(?:prototipo|pacote de dados|pacote de pesquisa|modelo de linguagem|consulte fontes financeiras confiaveis)\b/i.test(editorial))throw Error("Social blocked: internal editorial language");
const edition="20"+code.slice(0,2)+"-"+code.slice(2,4)+"-"+code.slice(4,6);
const mon=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const footer=code.slice(4,6)+" "+mon[Number(code.slice(2,4))-1]+" 20"+code.slice(0,2)+" • @portfoliointelligence";
const clean=s=>String(s??"").replace(/\s+/g," ").trim();
const required=(s,where)=>{const v=clean(s);if(!v)throw Error("Missing content: "+where);return v};
const section=t=>data.sections?.find(s=>s.title===t)?.items?.map(clean).filter(Boolean)||[];
const reading=v=>{const n=Number(String(v).replace(/[−–]/g,"-").replace("%","").replace(",",".").replace(/[^\d.+-]/g,""));return !Number.isFinite(n)?"NEUTRO":n>=.35?"POSITIVO":n>0?"NEUTRO/+":n<=-.35?"NEGATIVO":n<0?"NEUTRO/-":"NEUTRO"};
const marketRows=(data.markets||[]).filter(x=>x.name&&x.value).slice(0,10).map(x=>({ticker:clean(x.name.replace(" FUTUROS","")),change:clean(x.value),reading:reading(x.value)}));
if(!marketRows.length)throw Error("No market data");
const drivers=(data.drivers||[]).slice(0,3).map((x,i)=>({title:required(x.title||x.reason,"driver "+i),text:required(x.impact,"driver impact "+i)}));
if(drivers.length!==3)throw Error("Missing three drivers");
const agenda=(data.agenda||[]).map((x,i)=>typeof x==="string"?{title:"Evento "+(i+1),text:required(x,"agenda")}:{title:required([x.timeMadrid,x.name].filter(Boolean).join(" · "),"agenda "+i),text:[x.consensus&&"Consenso: "+x.consensus,x.previous&&"Anterior: "+x.previous,x.result&&x.result!=="Ainda não divulgado"&&"Resultado: "+x.result].filter(Boolean).join(" · ")||"Evento previsto; sem estimativas informadas."});
const paras=items=>items.map((text,i)=>({title:"",text:required(text,"paragraph "+i)}));
const cards=[
{id:"cover",background:29,title:"WALL STREET",subtitle:"ANTES DA ABERTURA",body:required(data.summary,"summary"),footer},
{id:"highlights",background:30,title:"DESTAQUES DO DIA",subtitle:"FUTUROS • VARIAÇÃO • LEITURA",marketRows,footer},
{id:"agenda",background:31,title:"AGENDA DO DIA",subtitle:"HORÁRIOS DE MADRID",blocks:agenda.length?agenda:[{title:"Agenda",text:"Sem eventos com data e horário confirmados nesta edição."}],footer},
{id:"pulse",background:32,title:"MARKET PULSE",subtitle:"3 LEITURAS PARA A ABERTURA",blocks:drivers,footer},
{id:"radar",background:33,title:"RADAR",subtitle:"O QUE OBSERVAR HOJE",blocks:paras(section("O que observar hoje")),footer},
{id:"earnings",background:34,title:"EARNINGS RADAR",subtitle:"RESULTADOS E EXPECTATIVAS",blocks:paras(section("Earnings Radar")),footer},
{id:"brasil",background:35,title:"BRASIL → WALL STREET",subtitle:"INVESTIDOR BRASILEIRO",blocks:paras(section("Brasil → EUA")),footer},
{id:"cta",background:36,title:"CONTEXTO ANTES DO RUÍDO",subtitle:"PRIMESPHERE INTELLIGENCE",blocks:[
{title:"Morning Brief",text:"Os principais acontecimentos da manhã para acompanhar o mercado americano, com contexto sobre riscos, empresas e indicadores."},
{title:"Aprofunde a análise",text:"O Morning Brief completo está disponível em primesphereintelligence.com. Os cards também foram preparados para fazer sentido por conta própria."},
{title:"Aviso",text:"Conteúdo informativo e educacional. Não constitui recomendação individual de investimento."}
],footer}
];
for(const c of cards){if(c.blocks?.length===0)throw Error("Missing complete section: "+c.id);for(const t of [c.body,...(c.blocks||[]).flatMap(b=>[b.title,b.text])].filter(Boolean))if(/…|\.{3}\s*$/.test(t))throw Error("Truncated content in "+c.id);}
const caption="Morning Brief PrimeSphere — "+code.slice(4,6)+"/"+code.slice(2,4)+"/20"+code.slice(0,2)+".\n\n"+required(data.summary,"caption")+"\n\nAnálise completa: primesphereintelligence.com\n\nConteúdo educacional, não é recomendação individual de investimento.\n\n#WallStreet #Mercados #Investimentos #PrimeSphere #PortfolioIntelligence";
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({edition,templateVersion:"primesphere-approved-v3",cards,caption},null,2)+"\n");
console.log("Complete social edition",edition,"assets",marketRows.length);
