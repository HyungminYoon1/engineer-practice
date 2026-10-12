import { concepts } from './curriculum.js';
export const VARIANTS = 8;
const step = (line, label, values, output = '') => ({line,label,values,output});
const rowText = rows => rows.map(row=>row.map(value=>value===null?'NULL':String(value)).join('|')).join('\n');
const cMain = body => '#include <stdio.h>\nint main(void) {\n'+body.map(line=>'  '+line).join('\n')+'\n  return 0;\n}';
const javaMain = (body, prefix='') => prefix+'public class Main {\n  public static void main(String[] args) {\n'+body.map(line=>'    '+line).join('\n')+'\n  }\n}';
const families = [];
function family(id, title, language, conceptIds, difficulty, build) { families.push({id,title,language,group:language==='sql'?'db':'code',conceptIds,difficulty,variants:VARIANTS,build}); }
family('C01','배열 포인터의 이동','c',['pointers','arrays'],2,v=>{
  const a=[3+v,7+v,11+v,17+v],inc=2+v;const b=[...a];b[1]+=inc;const first=[...b];b[1]+=b[2];const output=`${b[1]} ${b[2]} ${b[3]}`;
  return {code:cMain([`int a[] = {${a.join(', ')}};`,'int *p = a + 1;',`*p += ${inc};`,'p++;','p[-1] += *p;','printf("%d %d %d", a[1], *p, a[3]);']),expected:output,
    trace:[step(3,'배열 생성',{a:a.join(', ')}),step(4,'p가 a[1]을 가리킴',{p:'a[1]',value:a[1]}),step(5,'가리키는 요소 변경',{a:first.join(', ')}),step(6,'p를 다음 요소로 이동',{p:'a[2]',value:b[2]}),step(7,'p[-1]은 a[1]',{a:b.join(', ')}),step(8,'출력',{p:'a[2]'},output)],explanation:'p의 이동과 *p의 변경을 분리합니다. p++ 뒤 p[-1]은 바로 앞 요소 a[1]입니다.'};
});
family('C02','이중 반복과 선택 누적','c',['loops','arrays'],2,v=>{
  const a=Array.from({length:6},(_,i)=>i+2+v),trace=[];let sum=0;
  for(let i=0;i<2;i++)for(let j=0;j<3;j++){const used=(i+j)%2===0;if(used)sum+=a[i*3+j]*(i+1);trace.push(step(7,used?'조건을 만족해 누적':'조건이 거짓이라 유지',{i,j,element:a[i*3+j],sum}));}
  const output=String(sum);return {code:cMain([`int a[2][3] = {{${a.slice(0,3).join(', ')}}, {${a.slice(3).join(', ')}}};`,'int sum = 0;','for (int i = 0; i < 2; i++)','  for (int j = 0; j < 3; j++)','    if ((i + j) % 2 == 0) sum += a[i][j] * (i + 1);','printf("%d", sum);']),expected:output,trace:[step(4,'누적값 초기화',{sum:0}),...trace,step(8,'출력',{sum},output)],explanation:'행과 열을 각각 순회합니다. 선택되는 칸은 (0,0), (0,2), (1,1)이고 두 번째 행의 가중치는 2입니다.'};
});
family('C03','구조체 복사와 포인터 인수','c',['structs','functions'],3,v=>{
  const a=8+v,b=3+v,k=2+v,output=`${a+k} ${b*2} ${a}`;
  return {code:'#include <stdio.h>\nstruct Pair { int x, y; };\nvoid update(struct Pair *p, int k) {\n  p->x += k;\n  p->y *= 2;\n}\nint main(void) {\n'+`  struct Pair a = {${a}, ${b}};\n  struct Pair copy = a;\n  update(&a, ${k});\n`+'  printf("%d %d %d", a.x, a.y, copy.x);\n  return 0;\n}',expected:output,trace:[step(8,'원본 생성',{'a.x':a,'a.y':b}),step(9,'값을 복사',{'copy.x':a,'copy.y':b}),step(4,'포인터로 원본 필드 변경',{'a.x':a+k,'copy.x':a}),step(5,'두 번째 원본 필드 변경',{'a.y':b*2}),step(11,'출력',{},output)],explanation:'copy에는 두 정수 필드가 값으로 복사됩니다. update는 &a를 받아 원본만 변경하므로 copy.x는 유지됩니다.'};
});
family('C04','재귀의 반환 누적','c',['recursion','functions'],3,v=>{
  const n=3+v%4,trace=[];for(let i=n;i>=1;i--)trace.push(step(3,'하위 호출을 기다림',{n:i,stack:Array.from({length:n-i+1},(_,j)=>n-j).join(' → ')}));let value=1;trace.push(step(3,'종료 조건',{n:1,value}));for(let i=2;i<=n;i++){value+=2*i;trace.push(step(4,'반환값에 현재 n의 항을 더함',{n:i,value}));}const output=String(value);
  return {code:'#include <stdio.h>\nint f(int n) {\n  if (n <= 1) return 1;\n  return f(n - 1) + 2 * n;\n}\nint main(void) {\n'+`  printf("%d", f(${n}));\n`+'  return 0;\n}',expected:output,trace:[...trace,step(7,'출력',{},output)],explanation:'호출할 때의 n을 각각 유지합니다. f(1)=1에서 시작해 반환하면서 2n을 더하며 f(n)=n(n+1)-1입니다.'};
});
family('C05','문자 배열의 부분 문자열','c',['strings','pointers'],2,v=>{
  const offset=1+v%4,char=String.fromCharCode(75+v),s='ORBITAL'.split('');s[offset+1]=char;const output=s.slice(offset).join('')+'|'+char;
  return {code:cMain(['char s[] = "ORBITAL";',`char *p = s + ${offset};`,`p[1] = '${char}';`,'printf("%s|%c", p, s['+(offset+1)+']);']),expected:output,trace:[step(3,'문자 배열에는 종료 문자도 포함',{s:'ORBITAL\\0'}),step(4,'p의 시작 위치',{p:`s[${offset}]`}),step(5,'p[1] 위치 변경',{s:s.join('')+'\\0',index:offset+1}),step(6,'p부터 종료 문자 전까지 출력',{},output)],explanation:'수정 가능한 문자 배열을 사용합니다. p[1]은 s[offset+1]이고 %s는 p 위치에서부터 종료 문자 직전까지 출력합니다.'};
});
family('C06','비트 연산과 분기','c',['operators','branches'],3,v=>{
  const x=9+v,y=2+v,z0=(x&7)^(y<<1),even=(z0&1)===0,z=even?z0+x:z0-y,output=String(z);
  return {code:cMain([`int x = ${x}, y = ${y};`,'int z = (x & 7) ^ (y << 1);','if ((z & 1) == 0) z += x;','else z -= y;','printf("%d", z);']),expected:output,trace:[step(3,'초기값',{x,y}),step(4,'AND·시프트·XOR 순서',{low:x&7,shift:y<<1,z:z0}),step(even?5:6,even?'짝수 분기':'홀수 분기',{z}),step(7,'출력',{},output)],explanation:'먼저 괄호 안의 두 피연산자를 구하고 XOR합니다. z의 최하위 비트로 짝수·홀수를 판단해 해당 분기만 실행합니다.'};
});
family('J01','필드 숨김과 동적 메서드','java',['inheritance','overriding'],3,v=>{
  const a=4+v,b=9+2*v,output=`${a} ${a+b}`;return {code:`class Base {\n  int n = ${a};\n  int value() { return n * 2; }\n}\nclass Child extends Base {\n  int n = ${b};\n  @Override int value() { return n + super.n; }\n}\n`+javaMain(['Base ref = new Child();','System.out.print(ref.n + " " + ref.value());']),expected:output,trace:[step(11,'선언형과 실제 객체를 구분',{declared:'Base',actual:'Child','Base.n':a,'Child.n':b}),step(12,'필드는 선언형 Base의 필드',{field:a}),step(7,'메서드는 Child의 재정의 호출',{method:'Child.value()',value:a+b}),step(12,'출력',{},output)],explanation:'ref.n은 Base의 필드입니다. ref.value()는 실제 Child 객체의 오버라이딩 메서드를 호출하며 Child.n과 super.n을 더합니다.'};
});
family('J02','공유 static과 개별 필드','java',['objects','variables'],2,v=>{
  const a=5+v,b=2+v,d=3+v,e=2,output=`${a+d+e} ${b+d+1} ${b+e}`;return {code:`class Counter {\n  static int total = ${a};\n  int local = ${b};\n  Counter(int d) { local += d; total += d; }\n}\n`+javaMain([`Counter x = new Counter(${d});`,`Counter y = new Counter(${e});`,'x.local += 1;','System.out.print(Counter.total + " " + x.local + " " + y.local);']),expected:output,trace:[step(8,'첫 객체 생성',{total:a+d,'x.local':b+d}),step(9,'두 번째 객체가 같은 static 변경',{total:a+d+e,'y.local':b+e}),step(10,'x의 개별 필드만 변경',{'x.local':b+d+1,'y.local':b+e}),step(11,'출력',{},output)],explanation:'static total은 두 객체가 공유합니다. local은 객체마다 따로 유지되므로 x.local의 추가 변경이 y.local에 영향을 주지 않습니다.'};
});
family('J03','오버로딩과 명시적 형','java',['overloading','operators'],2,v=>{
  const a=3+v,b=12+v,x=5+v,output=`${x+a} ${x+b}`;return {code:`public class Main {\n  static int pick(int x) { return x + ${a}; }\n  static int pick(long x) { return (int)x + ${b}; }\n  public static void main(String[] args) {\n    int n = ${x};\n    System.out.print(pick(n) + " " + pick((long)n));\n  }\n}`,expected:output,trace:[step(5,'n은 int',{n:x,type:'int'}),step(2,'int 매개변수 메서드 선택',{argumentType:'int',result:x+a}),step(3,'long으로 변환하여 다른 메서드 선택',{argumentType:'long',result:x+b}),step(6,'출력',{},output)],explanation:'오버로딩은 호출할 때 인수의 형에 따라 선택됩니다. (long)n의 명시적 변환으로 두 번째 호출은 long 버전을 선택합니다.'};
});
family('J04','열거형의 값과 순서','java',['enum','arrays'],2,v=>{
  const weights=[3+v,7+v,12+v],i=v%3,output=`${weights[i]} ${i}`;return {code:`enum Mode {\n  CALM(${weights[0]}), RUN(${weights[1]}), STOP(${weights[2]});\n  final int weight;\n  Mode(int weight) { this.weight = weight; }\n}\n`+javaMain([`Mode m = Mode.values()[${i}];`,'System.out.print(m.weight + " " + m.ordinal());']),expected:output,trace:[step(2,'상수마다 별도 weight',{CALM:weights[0],RUN:weights[1],STOP:weights[2]}),step(8,'선언 순서로 상수 선택',{index:i,m:['CALM','RUN','STOP'][i]}),step(9,'필드값과 0 기반 순서를 출력',{},output)],explanation:'values()의 배열 인덱스와 ordinal()은 선언 순서입니다. weight는 생성자로 전달한 값이므로 ordinal과 같다고 가정하면 안 됩니다.'};
});
family('J05','예외 분기와 finally','java',['exceptions','branches'],3,v=>{
  const n=3+v,k=2+v%3,c=4,d=2,initial=n+k,exception=initial%2===0,after=exception?initial-c:initial*2,output=String(after+d);return {code:javaMain([`int x = ${n};`,'try {',`  x += ${k};`,'  if (x % 2 == 0) throw new IllegalStateException();','  x *= 2;','} catch (IllegalStateException ex) {',`  x -= ${c};`,'} finally {',`  x += ${d};`,'}','System.out.print(x);']),expected:output,trace:[step(3,'초기값',{x:n}),step(5,'try의 첫 변경',{x:initial}),step(6,exception?'예외를 던져 catch로 이동':'예외 없이 다음 문장 진행',{condition:exception}),step(exception?9:7,exception?'catch에서 감소':'try에서 두 배',{x:after}),step(11,'finally는 두 경우 모두 실행',{x:after+d}),step(13,'출력',{},output)],explanation:'예외가 발생하면 x*=2는 실행되지 않습니다. catch 또는 정상 try를 마친 뒤 finally의 증가가 적용됩니다.'};
});
family('P01','중첩 리스트의 얕은 복사','python',['py-sequence','objects'],3,v=>{
  const n=2+v,m=8+v,k=5+v,t=11+v,output=`2 3 ${t} ${k}`;return {code:`a = [[${n}, ${m}], [${k}]]\nb = a[:]\nb[0].append(${t})\nb.append([${t+1}])\nprint(len(a), len(b), a[0][-1], a[1][0])`,expected:output,trace:[step(1,'바깥·안쪽 리스트 생성',{a:`[[${n}, ${m}], [${k}]]`}),step(2,'바깥만 새 리스트, 안쪽은 공유',{outer:'a와 b는 다름',inner:'a[0]과 b[0]은 같음'}),step(3,'공유 안쪽에 추가',{a:`[[${n}, ${m}, ${t}], [${k}]]`}),step(4,'b의 바깥에만 추가',{'len(a)':2,'len(b)':3}),step(5,'출력',{},output)],explanation:'a[:]는 바깥 리스트의 얕은 복사입니다. b[0]을 통한 안쪽 변경은 a에도 보이지만 b.append는 a의 바깥 길이를 바꾸지 않습니다.'};
});
family('P02','슬라이스 방향과 독립 값','python',['py-sequence','arrays'],2,v=>{
  const n=2+v,k=5+v,reverse=v%2===1,ys=reverse?[n+5,n+3,n+1]:[n+1,n+3,n+5],output=`${ys.reduce((a,b)=>a+b,0)} ${n+2+k} ${ys.at(-1)}`;return {code:`xs = list(range(${n}, ${n+7}))\nys = xs[${reverse?'-2:0:-2':'1:6:2'}]\nxs[2] += ${k}\nprint(sum(ys), xs[2], ys[-1])`,expected:output,trace:[step(1,'range의 끝은 제외',{xs:Array.from({length:7},(_,i)=>n+i).join(', ')}),step(2,reverse?'뒤쪽에서 역방향 2칸 간격':'앞쪽에서 2칸 간격',{ys:ys.join(', ')}),step(3,'xs 요소를 바꾸어도 이미 복사된 정수 목록 유지',{'xs[2]':n+2+k,ys:ys.join(', ')}),step(4,'출력',{},output)],explanation:'슬라이스의 끝은 제외하고 step의 방향에 따라 인덱스를 선택합니다. 정수 요소의 새 대입은 별도 ys 목록의 값에 영향을 주지 않습니다.'};
});
family('P03','딕셔너리 누적과 제곱합','python',['py-map','loops'],2,v=>{
  const word=['CABAC','ABACAB','BCCABA','AACBBC','ABCABCA','AAABBC','BACABBA','CCABACA'][v],counts={},trace=[];for(const ch of word){counts[ch]=(counts[ch]??0)+1;trace.push(step(3,`${ch}의 횟수 증가`,{...counts}));}const score=Object.values(counts).reduce((s,n)=>s+n*n,0),output=`${Object.keys(counts).length} ${score} ${counts.A}`;
  return {code:`counts = {}\nfor ch in "${word}":\n    counts[ch] = counts.get(ch, 0) + 1\nscore = sum(n * n for n in counts.values())\nprint(len(counts), score, counts["A"])`,expected:output,trace:[...trace,step(4,'각 횟수의 제곱을 더함',{score}),step(5,'키 수·제곱합·A 횟수 출력',{},output)],explanation:'get은 없는 키에 0을 제공하고 매번 해당 키만 갱신합니다. len(counts)는 문자 종류 수이며 전체 문자 수가 아닙니다.'};
});
family('P04','기본 인수의 객체 재사용','python',['functions','py-sequence'],3,v=>{
  const a=2+v,b=3+v,c=7+v,d=4+v,output=`${a} ${a+b} ${c} ${a+b+d}`;return {code:`def bump(x, bucket=[]):\n    bucket.append(x)\n    return sum(bucket)\nprint(bump(${a}), bump(${b}), bump(${c}, []), bump(${d}))`,expected:output,trace:[step(1,'함수 정의 때 기본 리스트 하나 생성',{default:'[]'}),step(2,'첫 호출이 기본 리스트에 추가',{bucket:`[${a}]`,returns:a}),step(2,'두 번째 호출도 같은 기본 리스트',{bucket:`[${a}, ${b}]`,returns:a+b}),step(2,'명시적으로 새 리스트를 전달한 세 번째 호출',{bucket:`[${c}]`,returns:c}),step(2,'네 번째 호출은 다시 기본 리스트',{bucket:`[${a}, ${b}, ${d}]`,returns:a+b+d}),step(4,'왼쪽부터 호출하여 출력',{},output)],explanation:'가변 기본 인수는 호출마다 자동 생성되지 않습니다. 세 번째 호출의 []만 별도 리스트이므로 기본 인수의 누적에 참여하지 않습니다.'};
});
family('P05','람다의 참조와 기본값 바인딩','python',['functions','variables'],3,v=>{
  const n=3+v%4,output=`${n-1} 0 ${n-1}`;return {code:`funcs = [lambda: i for i in range(${n})]\nfixed = [lambda j=j: j for j in range(${n})]\nprint(funcs[0](), fixed[0](), fixed[-1]())`,expected:output,trace:[step(1,'첫 목록은 같은 나중의 i 값을 조회',{count:n,last_i:n-1}),step(2,'두 번째 목록은 정의 시의 j를 기본값으로 보관',{defaults:Array.from({length:n},(_,i)=>i).join(', ')}),step(3,'호출 시 조회와 정의 시 저장의 차이',{},output)],explanation:'첫 목록의 함수들은 호출 시 같은 i의 최종값을 조회합니다. lambda j=j는 각 생성 시 j의 값을 기본 인수에 보관합니다.'};
});

function sqlFixture(v) {
  const a=6+2*v,b=9+v,c=18-v,d=4+3*v;
  const members=[[1,`A${v}1`,'A'],[2,`B${v}2`,'A'],[3,`A${v}2`,'B'],[4,`C${v}3`,'C']];
  const orders=[[1,1,a,'DONE'],[2,1,null,v%2?'OPEN':'DONE'],[3,2,b,'OPEN'],[4,2,c,'DONE'],[5,3,d,'DONE'],[6,null,7,'OPEN']];
  const patterns=[['A%'],[`%${v%3+1}`]];
  const literal=x=>x===null?'NULL':typeof x==='number'?String(x):"'"+x+"'";
  const schema='CREATE TABLE members(id INTEGER, name TEXT, team TEXT);\nCREATE TABLE orders(id INTEGER, member_id INTEGER, qty INTEGER, state TEXT);\nCREATE TABLE patterns(rule TEXT);\n'+[ ['members',members],['orders',orders],['patterns',patterns] ].map(([name,rows])=>`INSERT INTO ${name} VALUES `+rows.map(row=>'('+row.map(literal).join(',')+')').join(',')+';').join('\n');
  return {members,orders,patterns,schema,tables:[{name:'members',headers:['id','name','team'],rows:members},{name:'orders',headers:['id','member_id','qty','state'],rows:orders},{name:'patterns',headers:['rule'],rows:patterns}]};
}
function sqlFamily(id,title,conceptIds,difficulty,build) { family(id,title,'sql',conceptIds,difficulty,v=>{const data=sqlFixture(v),item=build(v,data);return {...item,schema:data.schema,tables:data.tables.filter(t=>t.name!=='patterns'||id==='S05'),dialect:'SQLite',nativeExpected:item.nativeExpected??item.expected};}); }
sqlFamily('S01','LEFT JOIN과 두 COUNT',['sql-join','sql-null'],3,(v,d)=>{
  const rows=d.members.map(m=>{const matched=d.orders.filter(o=>o[1]===m[0]);return [m[0],matched.length,matched.filter(o=>o[2]!==null).length,matched.reduce((s,o)=>s+(o[2]??0),0)];}),output=rowText(rows);
  return {code:'SELECT m.id, COUNT(o.id), COUNT(o.qty), SUM(COALESCE(o.qty, 0))\nFROM members AS m LEFT JOIN orders AS o ON m.id = o.member_id\nGROUP BY m.id\nORDER BY m.id;',expected:output,headers:['id','COUNT(id)','COUNT(qty)','SUM'],trace:[step(2,'연결된 주문 수를 확인',{'회원1':2,'회원2':2,'회원3':1,'회원4':'NULL 확장 행'}),step(1,'NULL인 qty는 COUNT(qty)에서 제외',{rule:'COUNT(o.id)와 COUNT(o.qty)는 다름'}),{...step(4,'id 순으로 결과',{},output),table:{headers:['id','COUNT(id)','COUNT(qty)','SUM'],rows}}],explanation:'오른쪽 id가 없는 확장 행은 COUNT(o.id)에서 제외됩니다. qty의 NULL도 제외되지만 COALESCE는 SUM에 0을 제공합니다.'};
});
sqlFamily('S02','WHERE·GROUP BY·HAVING',['sql-group','sql-null'],3,(v,d)=>{
  const joined=d.orders.filter(o=>o[3]==='DONE'&&o[1]!==null).map(o=>[d.members.find(m=>m[0]===o[1])[2],o[2]]),map=new Map();for(const [team,qty]of joined){const item=map.get(team)??[team,0,0];item[1]++;item[2]+=qty??0;map.set(team,item);}const rows=[...map.values()].filter(r=>r[1]>=2).sort((a,b)=>a[0].localeCompare(b[0])),output=rowText(rows),query="SELECT m.team, COUNT(*), SUM(o.qty)\nFROM members m JOIN orders o ON m.id = o.member_id\nWHERE o.state = 'DONE'\nGROUP BY m.team\nHAVING COUNT(*) >= 2\nORDER BY m.team;";
  return {code:v===7?query.replace('HAVING','____'):query,nativeCode:query,expected:v===7?'HAVING':output,nativeExpected:output,kind:v===7?'term':'table',aliases:v===7?['HAVING']:undefined,prompt:v===7?'집계 결과의 조건을 지정하도록 빈칸에 들어갈 SQL 키워드를 쓰세요.':'최종 결과를 team 순서로 쓰세요.',headers:['team','COUNT(*)','SUM(qty)'],trace:[{...step(3,'DONE인 행만 남김',{}),table:{headers:['team','qty'],rows:joined}},{...step(4,'팀별로 집계',{}),table:{headers:['team','COUNT(*)','SUM(qty)'],rows:[...map.values()]}},{...step(5,'개수가 2 이상인 그룹만 유지',{},output),table:{headers:['team','COUNT(*)','SUM(qty)'],rows}}],explanation:'WHERE는 행을, HAVING은 그룹을 필터링합니다. COUNT(*)는 qty가 NULL인 행도 세고 SUM(qty)는 NULL을 더하지 않습니다.'};
});
sqlFamily('S03','상관 서브쿼리와 평균',['sql-subquery','sql-group'],3,(v,d)=>{
  const qty=d.orders.filter(o=>o[3]==='DONE'&&o[2]!==null).map(o=>o[2]),avg=qty.reduce((a,b)=>a+b,0)/qty.length;
  const rows=d.members.filter(m=>d.orders.some(o=>o[1]===m[0]&&o[2]!==null&&o[2]>avg)).map(m=>[m[0],m[1]]),output=rowText(rows);
  return {code:"SELECT m.id, m.name\nFROM members m\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.member_id = m.id\n    AND o.qty > (SELECT AVG(qty) FROM orders WHERE state = 'DONE')\n)\nORDER BY m.id;",expected:output,headers:['id','name'],trace:[step(6,'DONE의 NULL 아닌 수량으로 전체 평균 계산',{values:qty.join(', '),average:Number(avg.toFixed(4))}),step(5,'회원마다 조건을 만족하는 주문 존재 여부 확인',{matchedIds:rows.map(r=>r[0]).join(', ')}),{...step(8,'선택된 회원 결과',{},output),table:{headers:['id','name'],rows}}],explanation:'안쪽 AVG는 DONE만 대상으로 하지만 바깥 EXISTS의 주문에는 DONE 조건이 없습니다. 이 두 범위를 혼동하지 마세요.'};
});
sqlFamily('S04','NOT IN과 NULL',['sql-null','sql-subquery'],3,(v,d)=>({code:"SELECT id FROM members\nWHERE id NOT IN (SELECT member_id FROM orders WHERE state = 'OPEN')\nORDER BY id;",expected:'없음',nativeExpected:'',kind:'term',aliases:['없음','결과 없음','∅','empty'],prompt:'결과가 비어 있으면 ‘없음’, 아니면 id를 순서대로 쓰세요.',trace:[step(2,'안쪽 목록에 NULL이 존재',{open:d.orders.filter(o=>o[3]==='OPEN').map(o=>o[1]===null?'NULL':o[1]).join(', ')}),step(2,'일치하지 않는 값도 UNKNOWN이라 WHERE 통과 못함',{rows:0},'없음')],explanation:'NOT IN의 목록에 NULL이 있으면 비일치 후보의 결과도 UNKNOWN이 될 수 있습니다. WHERE는 TRUE인 행만 남겨 결과가 비어 있습니다.'}));
sqlFamily('S05','CROSS JOIN과 LIKE',['sql-join','sql-select'],2,(v,d)=>{
  const joined=d.members.flatMap(m=>d.patterns.map(p=>[m[1],p[0]])),matches=joined.filter(([name,p])=>p==='A%'?name.startsWith('A'):name.endsWith(p.slice(1))),output=String(matches.length);
  return {code:'SELECT COUNT(*)\nFROM members m CROSS JOIN patterns p\nWHERE m.name LIKE p.rule;',expected:output,kind:'number',trace:[{...step(2,'모든 회원·규칙 쌍을 생성',{}),table:{headers:['name','rule'],rows:joined}},{...step(3,'각 행의 규칙에 맞는 쌍만 유지',{}),table:{headers:['name','rule'],rows:matches}},step(1,'같은 회원도 규칙마다 별도 행으로 집계',{count:matches.length},output)],explanation:'회원 수를 세는 것이 아니라 조건을 만족하는 회원·규칙 쌍을 셉니다. 한 회원이 두 패턴에 맞으면 두 번 포함됩니다.'};
});
sqlFamily('S06','UNION ALL의 중복',['sql-select','sql-subquery'],2,(v,d)=>{
  const threshold=10+v,first=d.orders.filter(o=>o[1]!==null&&o[2]!==null&&o[2]>=threshold).map(o=>[o[1]]),second=d.members.filter(m=>m[2]==='A').map(m=>[m[0]]),rows=[...first,...second].sort((a,b)=>a[0]-b[0]),output=rowText(rows);
  return {code:`SELECT member_id AS id FROM orders WHERE qty >= ${threshold} AND member_id IS NOT NULL\nUNION ALL\nSELECT id FROM members WHERE team = 'A'\nORDER BY id;`,expected:output,headers:['id'],trace:[{...step(1,'첫 조회 결과',{}),table:{headers:['id'],rows:first}},{...step(3,'두 번째 조회 결과',{}),table:{headers:['id'],rows:second}},{...step(2,'ALL이므로 중복을 보존하고 정렬',{},output),table:{headers:['id'],rows}}],explanation:'UNION ALL은 두 결과의 중복을 제거하지 않습니다. UNION이라면 중복이 제거되지만 이 문제에는 ALL이 있습니다.'};
});

function numeric(id,title,conceptIds,difficulty,build) { families.push({id,title,language:'calculation',group:'systems',conceptIds,difficulty,variants:5,build}); }
numeric('N01','일반 서브넷의 호스트 수',['subnet'],2,v=>{const prefix=25+v,hosts=2**(32-prefix)-2;return {prompt:`일반적인 IPv4 /${prefix} 서브넷에서 네트워크·브로드캐스트 주소를 제외한 사용 가능 호스트 수를 정수로 쓰세요. /31·/32 예외는 다루지 않습니다.`,expected:String(hosts),trace:[step(1,'호스트 비트 수',{bits:32-prefix}),step(1,'전체 주소에서 예약 두 개 제외',{all:2**(32-prefix),hosts},String(hosts))],explanation:'남은 호스트 비트로 표현하는 전체 주소 수는 2의 거듭제곱입니다. 이 문제의 일반 서브넷에서는 두 주소를 제외합니다.'};});
numeric('N02','네트워크 주소의 마지막 옥텟',['subnet','operators'],2,v=>{const prefix=26+v%3,ip=93+v*19,block=2**(32-prefix),network=Math.floor(ip/block)*block;return {prompt:`IPv4 주소 192.168.8.${ip}/${prefix}의 네트워크 주소에서 마지막 옥텟만 정수로 쓰세요.`,expected:String(network),trace:[step(1,'서브넷 주소 블록 크기',{block}),step(1,'주소가 포함된 블록의 시작',{ip,network},String(network))],explanation:`마지막 옥텟을 ${block} 단위로 나눈 블록의 시작값입니다. 비트 AND 방식으로도 같은 결과를 얻습니다.`};});
numeric('N03','FCFS 총 대기시간',['scheduling'],2,v=>{const bursts=[4+v,2+v,7-v,3],trace=[];let clock=0,total=0;bursts.forEach((burst,i)=>{trace.push(step(i+1,`P${i+1} 시작`,{wait:clock,burst}));total+=clock;clock+=burst;});return {prompt:`P1~P4가 시각 0에 순서대로 도착했습니다. CPU 실행 시간은 ${bursts.join(', ')}입니다. 비선점 FCFS의 총 대기시간을 쓰세요. 문맥 전환 시간은 0입니다.`,expected:String(total),trace:[...trace,step(5,'각 작업의 시작 대기시간 합',{total},String(total))],explanation:'모두 동시에 도착했으므로 각 작업의 시작 시각이 대기시간입니다. 실행 시간을 합한 완료 시각과 혼동하지 마세요.'};});
numeric('N04','비선점 SJF 총 대기시간',['scheduling'],3,v=>{const bursts=[8+v,3+v,6+v,1+v],order=bursts.map((burst,i)=>({burst,id:i+1})).sort((a,b)=>a.burst-b.burst),trace=[];let clock=0,total=0;order.forEach(({burst,id},i)=>{trace.push(step(i+1,`P${id} 선택`,{wait:clock,burst}));total+=clock;clock+=burst;});return {prompt:`P1~P4의 도착 시각은 모두 0, 실행 시간은 ${bursts.join(', ')}입니다. 비선점 SJF의 총 대기시간을 쓰세요. 문맥 전환 시간은 0입니다.`,expected:String(total),trace:[...trace,step(5,'짧은 작업부터의 대기 합',{total},String(total))],explanation:'모든 작업이 이미 준비되어 있어 실행 시간이 짧은 순서로 고릅니다. 도착 시각이 다른 문제에는 이 전체 정렬을 그대로 적용할 수 없습니다.'};});
function pageFaults(sequence,size,lru){let frames=[],faults=0;const trace=[];sequence.forEach((page,i)=>{const hit=frames.includes(page);if(hit&&lru)frames=frames.filter(p=>p!==page);if(!hit){faults++;if(frames.length===size)frames.shift();}if(!hit||lru)frames.push(page);trace.push(step(i+1,`${page}: ${hit?'적중':'부재'}`,{frames:frames.join(' → '),faults}));});return {faults,trace};}
for(const [id,title,lru] of [['N05','LRU 페이지 부재',true],['N06','FIFO 페이지 부재',false]])numeric(id,title,['replacement','paging'],3,v=>{const seq=[1,2,3,1,4,2,5,1,2,3,4].map(n=>n+v),r=pageFaults(seq,3,lru);return {prompt:`초기에 빈 프레임 3개, 참조열 ${seq.join(' → ')}입니다. ${lru?'LRU':'FIFO'}에서 총 페이지 부재 횟수를 쓰세요.`,expected:String(r.faults),trace:[...r.trace,step(seq.length+1,'총 부재 횟수',{},String(r.faults))],explanation:lru?'프레임을 오래 사용되지 않은 순서로 적었습니다. 적중한 페이지도 가장 최근 위치로 옮깁니다.':'프레임은 들어온 순서입니다. 적중은 순서를 바꾸지 않으며 가득 차면 가장 먼저 들어온 페이지를 교체합니다.'};});
numeric('N07','디스크 FCFS 이동 거리',['scheduling'],2,v=>{const head=50+v*5,requests=[15+v,80-v,35+v*2,95-v],trace=[];let at=head,total=0;requests.forEach((next,i)=>{const distance=Math.abs(next-at);total+=distance;trace.push(step(i+1,'다음 요청으로 이동',{from:at,to:next,distance,total}));at=next;});return {prompt:`디스크 헤드가 ${head}번 트랙에 있습니다. 요청 순서는 ${requests.join(' → ')}입니다. FCFS의 총 이동 거리를 정수로 쓰세요.`,expected:String(total),trace:[...trace,step(5,'총 절대 이동 거리',{},String(total))],explanation:'요청 순서대로 이동하며 매 구간의 절대 차이를 더합니다. 마지막 위치와 첫 위치의 차이만 구하는 것이 아닙니다.'};});
numeric('N08','후위 표기식과 스택',['loops'],3,v=>{const a=2+v,b=3+v,c=4,d=5+v,tokens=[a,b,'+',c,'*',d,'-'],stack=[],trace=[];for(const token of tokens){if(typeof token==='number')stack.push(token);else{const right=stack.pop(),left=stack.pop();stack.push(token==='+'?left+right:token==='*'?left*right:left-right);}trace.push(step(trace.length+1,`${token} 처리`,{stack:stack.join(' → ')}));}return {prompt:`후위 표기식 ${tokens.join(' ')}의 계산 결과를 쓰세요. 피연산자는 정수이며 뺄셈은 먼저 꺼낸 값이 오른쪽 피연산자입니다.`,expected:String(stack[0]),trace:[...trace,step(tokens.length+1,'최종 스택값',{},String(stack[0]))],explanation:'숫자를 넣고 연산자를 만나면 오른쪽·왼쪽 순서로 꺼냅니다. 뺄셈의 두 피연산자 순서를 바꾸지 마세요.'};});

export const itemFamilies = Object.freeze(families.map(f=>Object.freeze({...f,conceptIds:Object.freeze(f.conceptIds)})));
const termFamilies=concepts.map(c=>({id:'T-'+c.id,title:c.title,group:c.group,language:'term',difficulty:2,conceptIds:[c.id],variants:1,build:()=>({prompt:c.prompt,expected:c.answers[0],aliases:c.answers,kind:'term',explanation:c.rule+' '+c.pitfall,trace:[]})}));
export const allFamilies=Object.freeze([...itemFamilies,...termFamilies]);
const questionCache=new Map();
export function getQuestion(code) {
  if(typeof code!=='string'||code.length>90)return null;
  if(questionCache.has(code))return questionCache.get(code);
  const match=/^([A-Z][A-Za-z0-9-]*)\.(\d)$/.exec(code);if(!match)return null;
  const f=allFamilies.find(f=>f.id===match[1]),variant=Number(match[2]);if(!f||variant>=f.variants)return null;
  const data=f.build(variant),kind=data.kind??(f.language==='sql'?'table':f.language==='term'?'term':f.language==='calculation'?'number':'output');
  const question=Object.freeze({...data,sourceCode:data.code??'',code,family:f.id,title:f.title,group:f.group,language:f.language,conceptIds:f.conceptIds,difficulty:f.difficulty,variant,kind,source:'자체 제작',version:1,
    prompt:data.prompt??(f.language==='sql'?'질의의 실행 결과를 쓰세요. 행은 줄바꿈, 열은 |로 구분합니다. NULL은 NULL로 씁니다.':'프로그램의 최종 출력 결과를 쓰세요. 표시된 출력 형식과 대소문자를 지키세요.'),
    hint:f.language==='sql'?'연결되는 행과 NULL을 먼저 확인하고, 조건·집계·정렬을 순서대로 적용하세요.':f.language==='calculation'?'한 단계씩 상태를 적고 전체 합과 마지막 값이 다른지 확인하세요.':'각 이름이 가리키는 대상과 실행 순서를 구별해 중간 상태를 적어보세요.',
  });
  questionCache.set(code,question);return question;
}
export const questionCodes=Object.freeze(allFamilies.flatMap(f=>Array.from({length:f.variants},(_,v)=>`${f.id}.${v}`)));
export function selectCodes({group='all',language='all',difficulty='all',concept=null}={}) {
  return questionCodes.filter(code=>{const q=getQuestion(code);return(group==='all'||q.group===group)&&(language==='all'||q.language===language)&&(difficulty==='all'||q.difficulty===Number(difficulty))&&(!concept||q.conceptIds.includes(concept));});
}
