import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import crypto from "node:crypto";

const [,,editionFile,bgDir,outDir]=process.argv;
const d=JSON.parse(await fs.readFile(editionFile,"utf8"));
const IDS=["cover","highlights","agenda","pulse","radar","earnings","brasil","cta"];
const TITLES=["WALL STREET","DESTAQUES DO DIA","AGENDA DO DIA","MARKET PULSE","RADAR","EARNINGS RADAR","BRASIL → WALL STREET","CONTEXTO ANTES DO RUÍDO"];
const BGS=[29,30,31,32,33,34,35,36];
if(d.templateVersion!=="primesphere-approved-v3"||d.cards?.length!==8)throw Error("HARD QA: V3 template/version/count mismatch");
d.cards.forEach((x,i)=>{if(x.id!==IDS[i]||x.title!==TITLES[i]||x.background!==BGS[i])throw Error("HARD QA: title or background changed on slide "+(i+1));if(!/^\d{2} [A-Z]{3} 20\d{2} • @portfoliointelligence$/.test(x.footer))throw Error("Invalid footer");});
if(!d.cards[1].marketRows?.length||d.cards[1].marketRows.length>10)throw Error("No real market data");
if(d.cards[3].blocks?.length!==3)throw Error("Market Pulse requires exactly three complete drivers");

const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const pctColor=v=>String(v).trim().startsWith("+")?"#4ade80":/^[−-]/.test(String(v).trim())?"#fb7185":"#e2e8f0";
const text=(s,x,y,size,fill="#fff",weight=500,extra="")=>'<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-family="Arial,sans-serif" font-size="'+size+'" font-weight="'+weight+'" '+extra+'>'+esc(s)+'</text>';
const rect=(x,y,w,h,rx=18)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="rgba(2,8,23,.76)" stroke="rgba(103,232,249,.22)" stroke-width="1.5"/>';
const estimate=(s,size)=>[...String(s)].reduce((a,c)=>a+size*(c===" "?0.30:/[MW@%]/.test(c)?0.85:/[il.,:;!|]/.test(c)?0.28:/[A-Z0-9]/.test(c)?0.66:0.55),0);
const wrap=(s,maxPx,size)=>{const out=[];let line="";for(const word of String(s).trim().split(/\s+/)){const next=(line+" "+word).trim();if(estimate(next,size)>maxPx&&line){out.push(line);line=word;}else line=next;if(estimate(line,size)>maxPx)throw Error("Unbreakable overwide text: "+word);}if(line)out.push(line);return out;};
const txtLines=(arr,x,y,size,gap,fill="#fff",weight=500)=>arr.map((line,i)=>text(line,x,y+i*gap,size,fill,weight)).join("");
const assertComplete=x=>{for(const s of [x.body,...(x.blocks||[]).flatMap(b=>[b.title,b.text])].filter(Boolean))if(/…|\.{3}\s*$/.test(s))throw Error("Truncated text rejected on "+x.id);};
const contentBox={top:440,bottom:1202,left:76,right:1004,pad:27};
function buildProse(x){
  assertComplete(x);
  const blocks=x.body?[{title:"",text:x.body}]:(x.blocks||[]);
  if(!blocks.length)throw Error("No meaningful body for "+x.id);
  const innerWidth=contentBox.right-contentBox.left-2*contentBox.pad;
  const limit=contentBox.bottom-contentBox.top-2*contentBox.pad;
  let chosen=null;
  for(let size=38;size>=28;size--){
    const gap=Math.ceil(size*1.29),headSize=Math.min(size+1,34),headGap=Math.ceil(headSize*1.2);
    const layouts=blocks.map(b=>{
      const h=b.title?wrap(b.title,innerWidth,headSize):[];
      const p=wrap(b.text,innerWidth,size);
      return {h,p,height:h.length*headGap+p.length*gap+(h.length?12:0)+17};
    });
    const total=layouts.reduce((sum,b)=>sum+b.height,0)+Math.max(0,layouts.length-1)*10;
    if(total<=limit){chosen={size,gap,headSize,headGap,layouts,total};break;}
  }
  if(!chosen)throw Error("HARD QA: full text does not fit at 28px on "+x.id+"; edit the source or redesign slide instead of truncating");
  let svg=rect(contentBox.left,contentBox.top,contentBox.right-contentBox.left,contentBox.bottom-contentBox.top,23);
  let y=contentBox.top+contentBox.pad+chosen.size;
  for(let i=0;i<blocks.length;i++){
    const b=chosen.layouts[i];
    if(b.h.length){svg+=txtLines(b.h,103,y,chosen.headSize,chosen.headGap,"#f6c453",700);y+=b.h.length*chosen.headGap+12;}
    svg+=txtLines(b.p,103,y,chosen.size,chosen.gap,"#ffffff",500);
    y+=b.p.length*chosen.gap+17;
    if(i!==blocks.length-1){svg+='<line x1="103" y1="'+(y-10)+'" x2="977" y2="'+(y-10)+'" stroke="rgba(148,163,184,.30)"/>';y+=10;}
  }
  if(y>contentBox.bottom)throw Error("HARD QA: bottom overflow "+x.id);
  return {svg,font:chosen.size};
}
function buildHighlights(x){
  const rows=x.marketRows;
  const X=[78,480,750],H=["ÍNDICE","VARIAÇÃO","LEITURA"];
  let svg=H.map((h,k)=>text(h,X[k],455,24,"#67e8f9",800)).join("");
  const step=rows.length<=5?108:63;
  rows.forEach((r,k)=>{
    const y=510+k*step;
    if(y+21>=1190)throw Error("HARD QA: market rows overflow");
    const label=wrap(r.ticker,375,23);
    if(label.length>2)throw Error("HARD QA: index label too long");
    svg+=rect(68,y-42,944,Math.min(step-5,88),10);
    svg+=txtLines(label,78,y-(label.length===2?15:0),23,26,"#fff",800);
    svg+=text(r.change,480,y,32,pctColor(r.change),800);
    svg+=text(r.reading,750,y,25,pctColor(r.change),800);
  });
  return {svg,font:30};
}
await fs.mkdir(outDir,{recursive:true});
const renderedFonts=[];
for(let i=0;i<8;i++){
  const x=d.cards[i],bg=path.join(bgDir,"background_"+String(x.background).padStart(2,"0")+".png");
  const title=wrap(x.title,960,64);
  if(title.length>2)throw Error("Title overflow on slide "+(i+1));
  contentBox.top=title.length>1?550:440;
  const content=x.id==="highlights"?buildHighlights(x):buildProse(x);
  renderedFonts.push(content.font);
  const titleSvg=title.map((q,j)=>text(q,76,255+j*74,64,j?"#67e8f9":"white",900)).join("");
  const svg='<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(2,8,23,.88)"/><stop offset=".62" stop-color="rgba(2,8,23,.38)"/><stop offset="1" stop-color="rgba(2,8,23,.18)"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/>'+text("PRIME",76,92,27,"white",800)+text("SPHERE",164,92,27,"#67e8f9",800)+text("INTELLIGENCE",76,123,18,"#cbd5e1",500,'letter-spacing="4"')+'<line x1="76" y1="145" x2="265" y2="145" stroke="#f6c453" stroke-width="4"/>'+text((i+1)+"/8",1004,103,22,"#cbd5e1",500,'text-anchor="end"')+titleSvg+text(x.subtitle,78,350+title.length*58,25,"#f6c453",800)+content.svg+'<line x1="76" y1="1230" x2="1004" y2="1230" stroke="rgba(246,196,83,.55)"/>'+text(x.footer,76,1272,24,"#dbeafe")+'</svg>';
  const output=path.join(outDir,"card_"+String(i+1).padStart(2,"0")+".png");
  await sharp(bg).resize(1080,1350,{fit:"cover"}).composite([{input:Buffer.from(svg)}]).png().toFile(output);
  const m=await sharp(output).metadata();
  if(m.width!==1080||m.height!==1350||m.format!=="png")throw Error("HARD QA dimensions/format");
}
const contract=crypto.createHash("sha256").update(JSON.stringify({v:d.templateVersion,ids:IDS,titles:TITLES,bgs:BGS})).digest("hex");
await fs.writeFile(path.join(outDir,"qa.json"),JSON.stringify({passed:true,templateVersion:d.templateVersion,contract,slides:8,width:1080,height:1350,minBodyFont:Math.min(...renderedFonts),minTableFont:23,slide2Columns:["Índice","Variação","Leitura"],slide2Rows:d.cards[1].marketRows.length,marketPulseBlocks:3,completeText:true,noEllipses:true},null,2));
console.log("COMPLETE SOCIAL QA PASS",contract,renderedFonts);
