import fs from 'node:fs';
const [,,file,...flags]=process.argv;
if(!file)throw Error('Usage: node scripts/fix-editorial-encoding.mjs <edition.json> [--write]');
const write=flags.includes('--write');
const cp1252=new Map([[0x20ac,0x80],[0x201a,0x82],[0x0192,0x83],[0x201e,0x84],[0x2026,0x85],[0x2020,0x86],[0x2021,0x87],[0x02c6,0x88],[0x2030,0x89],[0x0160,0x8a],[0x2039,0x8b],[0x0152,0x8c],[0x017d,0x8e],[0x2018,0x91],[0x2019,0x92],[0x201c,0x93],[0x201d,0x94],[0x2022,0x95],[0x2013,0x96],[0x2014,0x97],[0x02dc,0x98],[0x2122,0x99],[0x0161,0x9a],[0x203a,0x9b],[0x0153,0x9c],[0x017e,0x9e],[0x0178,0x9f]]);
const decoder=new TextDecoder('utf-8',{fatal:true});
function decodeOnce(s){
 const bytes=[];
 for(const ch of s){
  const n=ch.codePointAt(0);
  const b=n<=255?n:cp1252.get(n);
  if(b===undefined)return s;
  bytes.push(b);
 }
 try{return decoder.decode(Uint8Array.from(bytes));}catch{return s;}
}
const suspicious=/(?:Ã[\u0080-\u00bf\u201a-\u201e\u2020-\u2026\u02c6\u2030\u0160\u2039\u0152\u017d\u2018-\u201d\u2022\u02dc\u2122\u0161\u203a\u0153\u017e\u0178]|Â[\u0080-\u00bf]|â[\u0080-\u00bf\u20ac-\u2122])/u;
function repair(s){
 if(typeof s!=='string'||!suspicious.test(s))return s;
 let out=s;
 for(let i=0;i<2;i++){
  // Repair entire string only when every character can be encoded as CP1252.
  const fixed=decodeOnce(out);
  if(fixed===out)break;
  out=fixed;
 }
 return out;
}
let count=0;
function walk(x){
 if(typeof x==='string'){const y=repair(x);if(y!==x)count++;return y;}
 if(Array.isArray(x))return x.map(walk);
 if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,walk(v)]));
 return x;
}
const raw=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
const original=JSON.parse(raw);
const fixed=walk(original);
if(write){
 if(count){
  fs.copyFileSync(file,file+'.encoding-backup');
  fs.writeFileSync(file,JSON.stringify(fixed,null,2)+'\n','utf8');
 }
 console.log('Encoding repair:',count,'text fields changed; backup:',count?file+'.encoding-backup':'not needed');
}else console.log('Encoding inspection:',count,'text fields can be repaired. Run with --write to apply.');
