import { getConcept, references } from './curriculum.js';
export function el(tag,attributes={},...children) {
  const node=document.createElement(tag);
  for(const [key,value]of Object.entries(attributes)){
    if(value===null||value===undefined)continue;
    if(key.startsWith('on')&&typeof value==='function')node.addEventListener(key.slice(2).toLowerCase(),value);
    else if(key==='class')node.className=value;
    else if(['disabled','hidden','checked','selected','value'].includes(key))node[key]=value;
    else node.setAttribute(key,String(value));
  }
  for(const child of children.flat(Infinity)){if(child===null||child===undefined)continue;node.append(typeof child==='string'||typeof child==='number'?document.createTextNode(String(child)):child);}
  return node;
}
export const button=(label,handler,className='button',attrs={})=>el('button',{type:'button',class:className,onClick:handler,...attrs},label);
export function tableView(table) {
  return el('div',{class:'table-scroll'},el('table',{},el('caption',{},table.name??'결과표'),el('thead',{},el('tr',{},table.headers.map(h=>el('th',{scope:'col'},h)))),el('tbody',{},table.rows.length?table.rows.map(row=>el('tr',{},row.map(value=>el('td',{},value===null?'NULL':String(value))))):el('tr',{},el('td',{colspan:table.headers.length},'결과 없음')))));
}
export function sourceView(question) {
  if(!question.sourceCode)return null;
  return el('div',{class:'source-panel'},el('div',{class:'source-heading'},el('span',{},question.dialect??{c:'C11',java:'Java',python:'Python 3'}[question.language]??question.language),el('span',{},question.code)),el('ol',{class:'code-lines',tabindex:'0','aria-label':'문제 코드'},question.sourceCode.split('\n').map((line,i)=>el('li',{'data-line':i+1},el('code',{},line||' ')))));
}
export function questionBody(question,{showTitle=true}={}) {
  const fragment=el('div',{class:'question-body'});
  if(showTitle)fragment.append(el('h2',{},question.title));
  fragment.append(el('p',{class:'question-prompt'},question.prompt));
  if(question.tables)fragment.append(el('div',{class:'fixture-tables'},question.tables.map(tableView)));
  const source=sourceView(question);if(source)fragment.append(source);
  return fragment;
}
export function traceView(question) {
  if(!question.trace.length)return el('p',{class:'muted'},'개념의 구별 기준과 예시를 함께 확인하세요.');
  let index=0;
  const title=el('strong',{}),position=el('span',{class:'mono muted'}),values=el('dl',{class:'trace-values'}),result=el('div',{}),output=el('pre',{class:'trace-output'});
  const back=button('← 이전 단계',()=>{index--;render();},'button subtle'),next=button('다음 단계 →',()=>{index++;render();},'button subtle');
  const root=el('section',{class:'trace-panel','aria-label':'실행 과정'},el('div',{class:'trace-heading'},el('h3',{},'한 단계씩 확인'),position),title,values,result,output,el('div',{class:'row'},back,next));
  function render(){const frame=question.trace[index];title.textContent=frame.label;position.textContent=`${index+1} / ${question.trace.length}`;values.replaceChildren(...Object.entries(frame.values).flatMap(([name,value])=>[el('dt',{},name),el('dd',{},String(value))]));result.replaceChildren(...(frame.table?[tableView(frame.table)]:[]));output.textContent=frame.output?'출력  '+frame.output:'';output.hidden=!frame.output;back.disabled=index===0;next.disabled=index===question.trace.length-1;
    const highlight=()=>{const scope=root.closest('.result-item')??document.querySelector('.question-card');for(const line of scope?.querySelectorAll('.question-body [data-line]')??[])line.classList.toggle('current-line',Number(line.dataset.line)===frame.line);};
    highlight();queueMicrotask(highlight);
  }
  render();return root;
}
export function relatedConcepts(ids,onSelect) {
  return el('div',{class:'concept-links'},ids.map(id=>{const c=getConcept(id);return c?button(c.title,()=>onSelect(id),'link-button'):null;}));
}
export function referenceLink(key) {
  const source=references[key];return source?el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer',class:'reference-link'},source.label+' ↗'):null;
}
export function metric(label,value,detail='') {return el('div',{class:'metric'},el('span',{class:'muted'},label),el('strong',{},String(value)),detail?el('small',{class:'muted'},detail):null);}
export function emptyMessage(title,description,action=null) {return el('div',{class:'empty-state'},el('h2',{},title),el('p',{class:'muted'},description),action);}
