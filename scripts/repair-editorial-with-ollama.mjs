import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const [,,editionPath,researchPath]=process.argv;
if(!editionPath||!researchPath) throw Error('Usage: node scripts/repair-editorial-with-ollama.mjs <edition.json> <research.json>');
const MAX_REPAIRS=2;
const original=await fs.readFile(editionPath,'utf8');
const initial=JSON.parse(original);
const archive=JSON.parse(await fs.readFile(researchPath,'utf8'));
const research=archive.research?.answer?archive.research:archive;
if(typeof research.answer!=='string'||!research.answer.trim()) throw Error('Repair: missing Bigdata research answer');
if(archive.date && archive.date!=='20'+initial.date.slice(0,2)+'-'+initial.date.slice(2,4)+'-'+initial.date.slice(4))throw Error('Repair: research date mismatch');
const validate=()=>{
 const checks=[
  ['Editorial V2', 'scripts/validate-editorial.mjs',[editionPath]],
  ['Bigdata factual audit','scripts/audit-bigdata-edition.mjs',[editionPath,researchPath]]
 ];
 const errors=[];
 for(const [name,script,args] of checks){
  const result=spawnSync(process.execPath,[script,...args],{encoding:'utf8',env:{...process.env,EDITORIAL_STRICT_QA:'true'},timeout:90000});
  if(result.status!==0)errors.push(name+': '+(result.stderr||result.stdout||result.error?.message||'unknown failure').trim().slice(0,2500));
 }
 return errors;
};
const endpoint=(process.env.OLLAMA_URL||'http://127.0.0.1:11434').replace(/\/$/,'');
const model=process.env.OLLAMA_MODEL||'qwen2.5:7b';
const ask=async(edition,feedback)=>{
 const controller=new AbortController();
 const idleMs=Number(process.env.OLLAMA_IDLE_TIMEOUT_MS||600000);
 let timer;
 const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(new Error('Ollama repair idle timeout')),idleMs);};
 reset();
 try{
  const response=await fetch(endpoint+'/api/chat',{
   method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({
    model,stream:true,format:'json',keep_alive:'10m',
    options:{temperature:0,num_ctx:8192,num_predict:5500},
    messages:[
     {role:'system',content:'Você é revisor financeiro pt-BR. O pacote Bigdata é a ÚNICA autoridade factual. Corrija SOMENTE os erros indicados. Devolva exclusivamente o JSON completo Editorial V2, mantendo exatamente a estrutura e as seis seções, as três razões, as fontes, a data e o tipo. Nunca invente fatos, números ou fontes. Para futuros versus à vista, use instrumento e período exatos. Para earnings Post-Close, use linguagem de evento futuro, nunca divulgou. Para movimentos, respeite o sinal da variação no Bigdata. Não remova dados corretos para esconder problemas. Não consulte fontes externas.'},
     {role:'user',content:JSON.stringify({
      task:'Corrigir o JSON de acordo com os erros de auditoria. Responder JSON completo.',
      auditErrors:feedback,
      bigdataAnswer:research.answer.slice(0,12000),
      edition
     })}
    ]
   })
  });
  if(!response.ok)throw Error('Ollama repair HTTP '+response.status+' '+(await response.text()).slice(0,400));
  const reader=response.body?.getReader();
  if(!reader)throw Error('Ollama repair missing stream');
  const decoder=new TextDecoder();
  let pending='',output='',doneFlag=false;
  const consume=line=>{
   if(!line.trim())return;
   const item=JSON.parse(line);
   if(item.error)throw Error('Ollama repair: '+item.error);
   output+=item.message?.content||'';
   if(item.done)doneFlag=true;
  };
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   reset();
   pending+=decoder.decode(value,{stream:true});
   let pos;
   while((pos=pending.indexOf('\n'))>=0){consume(pending.slice(0,pos));pending=pending.slice(pos+1);}
  }
  pending+=decoder.decode();
  if(pending.trim())consume(pending);
  if(!doneFlag||!output.trim())throw Error('Ollama repair stream incomplete');
  return JSON.parse(output);
 }finally{clearTimeout(timer);}
};
const fixedFields=['schemaVersion','date','kind','label','updatedAtMadrid','sources'];
const preserve=proposal=>{
 if(!proposal||typeof proposal!=='object'||Array.isArray(proposal))throw Error('Repair returned non-object JSON');
 for(const key of fixedFields)proposal[key]=initial[key];
 if(initial.title?.includes('TESTE HISTÓRICO')&&!String(proposal.title||'').includes('TESTE HISTÓRICO'))proposal.title=initial.title;
 if(initial.summary?.includes('TESTE HISTÓRICO')&&!String(proposal.summary||'').includes('TESTE HISTÓRICO'))proposal.summary='TESTE HISTÓRICO (não é boletim ao vivo). '+String(proposal.summary||'');
 return proposal;
};
let feedback=validate();
if(!feedback.length){console.log('Editorial and Bigdata audit already passed; no repair required');process.exit(0);}
console.log('Initial editorial audit failed; attempting up to '+MAX_REPAIRS+' Ollama repairs without new Bigdata queries');
let edition=initial;
for(let attempt=1;attempt<=MAX_REPAIRS;attempt++){
 try{
  const proposal=preserve(await ask(edition,feedback));
  await fs.writeFile(editionPath,JSON.stringify(proposal,null,2)+'\n');
  const next=validate();
  if(!next.length){
   console.log('Ollama repair '+attempt+' passed editorial and Bigdata audits');
   process.exit(0);
  }
  console.error('Ollama repair '+attempt+' still fails: '+next.join(' | '));
  edition=proposal;
  feedback=next;
 }catch(error){
  console.error('Ollama repair '+attempt+' failed: '+error.message);
  feedback=['Repair failure: '+error.message,...feedback];
 }
}
await fs.writeFile(editionPath,original);
console.error('All repair attempts failed. Original edition restored; publication blocked.');
process.exitCode=1;
