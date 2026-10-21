import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const [,,editionPath,researchPath]=process.argv;
if(!editionPath||!researchPath) throw Error('Usage: node scripts/repair-editorial-with-ollama.mjs <edition.json> <research.json>');
const MAX_REPAIRS=2;
const MAX_REPAIR_MS=Number(process.env.OLLAMA_REPAIR_MAX_MS||8*60*1000);
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
 const idleMs=Number(process.env.OLLAMA_IDLE_TIMEOUT_MS||120000);
 const deadline=setTimeout(()=>controller.abort(new Error('Ollama repair exceeded '+MAX_REPAIR_MS+' ms')),MAX_REPAIR_MS);
 let timer;
 const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(new Error('Ollama repair idle timeout')),idleMs);};
 reset();
 try{
  const response=await fetch(endpoint+'/api/chat',{
   method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({
    model,stream:true,format:{type:'object',properties:{edits:{type:'array',items:{type:'object',properties:{section:{type:'string'},field:{type:'string'},value:{type:'string'}},required:['section','field','value']}}},required:['edits']},keep_alive:'10m',
    options:{temperature:0,num_ctx:8192,num_predict:1200},
    messages:[
     {role:'system',content:'Você é revisor financeiro pt-BR. Bigdata é a única fonte factual. Responda apenas JSON com edits: array de objetos {section,field,value}. Cada edição altera UM campo de texto, sem reescrever o JSON inteiro. Para section use summary, drivers[0], drivers[1], drivers[2], sections[0] até sections[5]. Para field use summary, reason, impact ou content conforme a seção. Preserve o resto do relatório. Corrija somente erros indicados, sem inventar fatos. Máximo de 5 edições por resposta.'},
     {role:'user',content:JSON.stringify({
      task:'Devolver apenas edições pontuais dos campos incorretos, nunca o relatório inteiro.',
      auditErrors:feedback,
      bigdataAnswer:research.answer.slice(0,12000),
      edition:{summary:edition.summary,drivers:edition.drivers,sections:edition.sections}
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
 }finally{clearTimeout(timer);clearTimeout(deadline);}
};
const applyEdits=(current,response)=>{
 if(!Array.isArray(response?.edits)||response.edits.length<1||response.edits.length>5)throw Error('Repair returned no valid limited edits');
 const next=structuredClone(current);
 for(const edit of response.edits){
  const {section,field,value}=edit;
  if(typeof value!=='string'||!value.trim()||value.length>3000)throw Error('Invalid repair text');
  if(section==='summary'&&field==='summary')next.summary=value;
  else if(/^drivers\\[[0-2]\\]$/.test(section)&&['reason','impact'].includes(field))next.drivers[Number(section[8])][field]=value;
  else if(/^sections\\[[0-5]\\]$/.test(section)&&field==='content')next.sections[Number(section[9])].content=value;
  else throw Error('Repair attempted to modify protected field '+section+'.'+field);
 }
 if(current.summary?.includes('TESTE HISTÓRICO')&&!next.summary.includes('TESTE HISTÓRICO'))next.summary='TESTE HISTÓRICO (não é boletim ao vivo). '+next.summary;
 return next;
};
let feedback=validate();
if(!feedback.length){console.log('Editorial and Bigdata audit already passed; no repair required');process.exit(0);}
console.log('Initial editorial audit failed; attempting up to '+MAX_REPAIRS+' Ollama repairs without new Bigdata queries');
let edition=initial;
for(let attempt=1;attempt<=MAX_REPAIRS;attempt++){
 try{
  const proposal=applyEdits(edition,await ask(edition,feedback));
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
