import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { questionCodes, getQuestion } from '../dist/src/questions.js';
const root=resolve('dist');
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=resolve(dir,entry.name);if(entry.isDirectory()){await walk(path);continue;}
  if(/(?:\.env|\.pdf|backup|criteria)/i.test(entry.name))throw new Error('Non-public artifact in dist');
  const data=await readFile(path);if(data.subarray(0,3).equals(Buffer.from([239,187,191])))throw new Error('Unexpected BOM');
  if(entry.name.endsWith('.js'))execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
  if(entry.name.endsWith('.html')){const text=data.toString('utf8');for(const[,ref]of text.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:)/.test(ref))continue;await readFile(resolve(dirname(path),ref.endsWith('/')?ref+'index.html':ref));}
    if(!text.includes('lang="ko"')||!text.includes('name="viewport"')||!text.includes('정보처리기사 실기 학습실'))throw new Error('Missing metadata or precise product name');}
  if(entry.name.endsWith('.js')&&/\beval\s*\(|\.innerHTML\s*=|\blocalStorage\.clear\s*\(|\bfetch\s*\(/.test(data.toString('utf8')))throw new Error('Unexpected runtime execution/storage/network boundary');
}}
await walk(root);for(const code of questionCodes)if(getQuestion(code).source!=='자체 제작')throw new Error('Unknown item provenance');
console.log('Static assets, syntax, name, provenance and runtime boundaries: PASS');
