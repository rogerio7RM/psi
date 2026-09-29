import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [,, editionFile, backgroundsDir, outDir] = process.argv;
if (!editionFile || !backgroundsDir || !outDir) throw new Error("Usage: node render-instagram-cards.mjs edition.json backgrounds out");
const data = JSON.parse(await fs.readFile(editionFile, "utf8"));
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.edition) || !Array.isArray(data.cards) || data.cards.length !== 8) throw new Error("Edition must contain exactly 8 cards");
await fs.mkdir(outDir, {recursive:true});
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function wrap(s,max=24){const w=String(s).split(/\s+/);let a=[],l="";for(const x of w){if((l+" "+x).trim().length>max&&l){a.push(l);l=x}else l=(l+" "+x).trim()}if(l)a.push(l);return a}
for (let i=0;i<8;i++){
 const c=data.cards[i], bg=path.join(backgroundsDir,`background_${String(c.background).padStart(2,"0")}.png`);
 const title=wrap(c.title,22), body=wrap(c.body,34);
 const svg=`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
 <rect width="1080" height="1350" fill="rgba(2,8,23,.28)"/>
 <rect x="70" y="110" width="940" height="1110" rx="30" fill="rgba(2,8,23,.68)"/>
 <text x="110" y="185" fill="#67e8f9" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="2">${esc(c.eyebrow)}</text>
 ${title.map((x,j)=>`<text x="110" y="${310+j*86}" fill="white" font-family="Arial,sans-serif" font-size="76" font-weight="800">${esc(x)}</text>`).join("")}
 <rect x="110" y="${350+title.length*86}" width="420" height="58" rx="12" fill="#0891b2"/>
 <text x="135" y="${390+title.length*86}" fill="white" font-family="Arial,sans-serif" font-size="30" font-weight="800">${esc(c.accent)}</text>
 ${body.map((x,j)=>`<text x="110" y="${530+title.length*86+j*54}" fill="white" font-family="Arial,sans-serif" font-size="40" font-weight="500">${esc(x)}</text>`).join("")}
 <text x="110" y="1160" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="27">${esc(c.footer)}</text>
 </svg>`;
 const out=path.join(outDir,`card_${String(i+1).padStart(2,"0")}.png`);
 await sharp(bg).resize(1080,1350,{fit:"cover"}).composite([{input:Buffer.from(svg)}]).png({quality:92}).toFile(out);
 const m=await sharp(out).metadata(); if(m.width!==1080||m.height!==1350) throw new Error("Invalid dimensions "+out);
}
console.log("QA OK: 8 cards, 1080x1350.");
