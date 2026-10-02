import fs from "node:fs/promises";
import path from "node:path";

const [,, source, output] = process.argv;
if (!source || !output) throw new Error("Usage: node generate-social-edition.mjs edition.tsx output.json");
const raw = await fs.readFile(source, "utf8");
const code = path.basename(source).match(/^(\d{6})\.tsx$/)?.[1];
if (!code) throw new Error("Morning Brief filename must be YYMMDD.tsx");
const edition = `20${code.slice(0,2)}-${code.slice(2,4)}-${code.slice(4,6)}`;
const dmY = `${code.slice(4,6)}/${code.slice(2,4)}/20${code.slice(0,2)}`;
const plain = s => String(s).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const section = title => {
 const marker=`<Box title="${title}">`, i=raw.indexOf(marker);
 if(i<0) throw new Error("Missing Morning Brief section: "+title);
 const j=raw.indexOf("</Box>",i); if(j<0) throw new Error("Unclosed section: "+title);
 return plain(raw.slice(i+marker.length,j));
};
const header = raw.match(/<p className="mt-4 text-lg leading-8">([\s\S]*?)<\/p>/)?.[1];
if(!header) throw new Error("Missing Morning Brief summary");
const snapRaw=section("Wall Street em 30 segundos");
const pairs=[...raw.matchAll(/\['([^']+)','([^']+)'\]/g)].slice(0,10).map(m=>[m[1],m[2]]);
if(pairs.length!==10) throw new Error("Snapshot must contain exactly 10 instruments");
const three=["01 · Payroll domina","02 · Yields aliviam","03 · Petróleo recua"].map(section);
const movers=section("Premarket Movers"), agenda=section("Agenda do dia"), earnings=section("Earnings Radar"), watch=section("O que observar hoje");
const short=(s,n=210)=>s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,"")+"…";
const footer=`${code.slice(4,6)} ${["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][Number(code.slice(2,4))-1]} 20${code.slice(0,2)} • @portfoliointelligence`;
const cards=[
 {background:29,eyebrow:"PRIMESPHERE INTELLIGENCE",title:"Wall Street",accent:"ANTES DA ABERTURA",body:short(plain(header),180),footer},
 {background:30,eyebrow:"WALL STREET EM 30 SEGUNDOS",title:"Mercado em espera",accent:"SNAPSHOT",body:short(pairs.slice(0,4).map(x=>x.join(" ")).join(" | ")+" • VIX "+pairs[4][1]+" • 10Y "+pairs[5][1],190),footer:"PrimeSphere Intelligence"},
 {background:31,eyebrow:"AS 3 COISAS DO DIA",title:"Dados + juros",accent:"FOCO DO MERCADO",body:short(three.map((x,i)=>`${i+1} ${x}`).join(" "),205),footer:"Número → motivo → impacto"},
 {background:32,eyebrow:"PREMARKET MOVERS",title:"Quem está se mexendo",accent:"MOVERS",body:short(movers,205),footer:"Catalisadores confirmados no Morning Brief"},
 {background:33,eyebrow:"AGENDA",title:"O relógio do mercado",accent:"HOJE",body:short(agenda,205),footer:"Horários de Madrid"},
 {background:34,eyebrow:"EARNINGS RADAR",title:"Resultados no radar",accent:"EARNINGS",body:short(earnings,200),footer:"PrimeSphere Intelligence"},
 {background:35,eyebrow:"O QUE OBSERVAR",title:"Radar da sessão",accent:"RADAR",body:short(watch,200),footer:"PrimeSphere Intelligence"},
 {background:36,eyebrow:"PRIMESPHERE INTELLIGENCE",title:"Contexto antes do ruído",accent:"PRIMESPHEREINTELLIGENCE.COM",body:"Acompanhe o Morning Brief completo no site. Conteúdo informativo e educacional; não é recomendação de investimento.",footer:"@portfoliointelligence"}
];
const caption=`Morning Brief PrimeSphere — ${dmY}. ${short(plain(header),300)}\n\nConteúdo informativo e educacional. Não constitui recomendação individual de investimento.\n\n#WallStreet #Mercados #Investimentos #PrimeSphere #PortfolioIntelligence`;
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify({edition,caption,cards},null,2)+"\n");
console.log("Generated social JSON:",edition);
