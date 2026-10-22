// Original bounded exercises. Pure content/math only; no DOM, storage or user-code execution.
const frame=(label,values,output='')=>({line:1,label,values,output});
const textRows=rows=>rows.map(row=>row.join('|')).join('\n');
export const caseReferences={
  routine:{label:'MySQL 8.4 · 저장 프로시저와 함수',url:'https://dev.mysql.com/doc/refman/8.4/en/create-procedure.html'},
  grant:{label:'PostgreSQL · GRANT',url:'https://www.postgresql.org/docs/current/sql-grant.html'},
  revoke:{label:'PostgreSQL · REVOKE',url:'https://www.postgresql.org/docs/current/sql-revoke.html'},
  binding:{label:'OWASP · SQL 삽입 방어',url:'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'},
  ssrf:{label:'OWASP · SSRF 방어',url:'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html'},
  xxe:{label:'OWASP · XML 외부 개체 방어',url:'https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html'},
  password:{label:'OWASP · 비밀번호 저장',url:'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'},
  forms:{label:'W3C · 입력 컨트롤의 이름',url:'https://www.w3.org/WAI/tutorials/forms/labels/'},
};
export const caseConceptRows=[
  ['requirements-validation','dev','요구사항 검증과 추적','요구사항이 명확·일관·실현 가능·검증 가능한지 확인하고 설계와 테스트의 연결을 추적합니다.','R1을 만족하는 설계는 있어도 시험이 연결되지 않으면 검증 누락입니다.','추적표의 표시 개수만 세지 말고 각 요구사항에 필요한 산출물이 연결되는지 봅니다.','요구사항이 명확하고 일관되며 실제 검증 가능한지 확인하는 활동은?',['요구사항 검증'],'requirements,traceability','exam'],
  ['uml-usecase','dev','UML 유스케이스의 include와 extend','include는 공통 동작을 포함하며, extend는 정해진 확장 지점에서 조건부 동작을 덧붙입니다.','결제에서 인증을 항상 포함하는 경우와 조건 충족 시 쿠폰 처리를 확장하는 경우를 구분합니다.','include의 화살표는 포함되는 쪽, extend는 확장 대상 기본 유스케이스 쪽을 향합니다.','UML 유스케이스에서 기본 동작에 조건부 행동을 확장하는 관계의 이름은?',['extend','확장'],'uml','uml'],
  ['lossless','db','무손실 분해','분해된 관계를 조인했을 때 원래 관계와 정확히 같고 허위 행이 생기지 않아야 합니다.','이진 분해에서 공통 속성이 한쪽 관계를 함수적으로 결정하면 무손실 조건을 만족합니다.','속성을 하나도 버리지 않았다는 이유만으로 무손실이라고 볼 수 없습니다.','분해 관계를 조인했을 때 허위 행 없이 원래 관계를 복원하는 성질은?',['무손실 분해','무손실 조인','lossless join'],'fd,normalization','design'],
  ['procedure','db','저장 프로시저 작성','DB에 저장된 절차를 호출하며 입력·출력 인수와 제어문을 DBMS 문법에 맞게 작성합니다.','MySQL에서는 CREATE PROCEDURE와 CALL을 사용하고 IN·OUT·INOUT 인수 방향을 구분합니다.','SQLite에는 같은 프로시저 문법이 없습니다. DELIMITER는 mysql 클라이언트 명령이지 서버 SQL이 아닙니다.','MySQL에서 저장 프로시저를 명시적으로 호출하는 SQL 키워드는?',['CALL'],'trigger,sql-dml','routine'],
  ['stored-function','db','저장 함수와 반환값','저장 함수는 정의된 반환 자료형의 값을 RETURN으로 돌려줍니다.','MySQL에서 RETURNS INT는 반환 형식이고 RETURN x+1은 값을 돌려주는 문장입니다.','RETURNS와 RETURN을 혼동하거나 함수를 프로시저의 OUT 인수와 같은 문법으로 작성하지 않습니다.','MySQL 저장 함수 선언에서 반환 자료형 앞에 사용하는 키워드는?',['RETURNS'],'procedure,functions','routine'],
  ['dcl-authority','db','권한 부여와 회수','객체·권한·대상을 정해 GRANT로 부여하고 REVOKE로 회수합니다.','PostgreSQL에서 GRANT SELECT ON TABLE reports TO analyst;처럼 대상을 명시합니다.','GRANT는 TO, REVOKE는 FROM입니다. 테이블 소유권과 개별 권한은 같지 않습니다.','SQL에서 객체 권한을 회수하는 명령은?',['REVOKE'],'sql-dcl,authorization','revoke'],
  ['db-anomalies','db','읽기 이상 사례의 구분','미확정 값을 읽는 dirty read, 같은 행 재조회 값 변경, 조건 조회의 행 집합 변경을 구별합니다.','행 값이 바뀌는 비반복 읽기와 새로운 행이 나타나는 팬텀 읽기는 관찰 대상이 다릅니다.','격리 수준별 실제 구현은 DBMS마다 다릅니다. 관찰한 현상과 방지 수준을 구분합니다.','다른 트랜잭션이 아직 확정하지 않은 변경을 읽는 현상은?',['dirty read','더티 리드','오손 읽기'],'transaction,isolation','transaction'],
  ['ui-accessibility','dev','화면 상태와 접근성','입력의 목적·오류·다음 행동을 표시하고 키보드와 보조기술로도 조작할 수 있게 설계합니다.','label의 for와 입력의 id를 맞춰 이름을 연결합니다.','색만으로 상태를 구별하거나 오류 이후의 복구 행동이 없는 화면은 부족합니다.','HTML label에서 입력 컨트롤의 id를 연결하는 속성은?',['for'],'storyboard','forms'],
  ['mcdc','dev','MC/DC와 조건의 독립 영향','다른 조건을 고정하고 한 조건만 바꾼 두 테스트에서 결정 결과도 바뀌는지 각 조건별로 확인합니다.','A AND B에서 A의 영향은 B를 참으로 고정한 (T,T)와 (F,T) 쌍으로 확인합니다.','각 조건의 참·거짓을 한 번씩 보는 조건 커버리지만으로 독립 영향을 증명하지 못합니다.','각 조건이 결정 결과에 독립적으로 영향을 주는지 확인하는 커버리지의 약어는?',['MC/DC','MCDC'],'coverage,whitebox','exam'],
  ['secure-binding','dev','SQL 파라미터 바인딩','SQL 구조와 외부에서 받은 값을 분리하여 준비된 문장에 값을 바인딩합니다.','JDBC의 ? 자리에는 PreparedStatement의 setString 등으로 값을 전달합니다.','특수문자 일부를 삭제하거나 사용자 입력을 문자열 연결하는 방식은 같은 보장이 아닙니다.','SQL 구조와 사용자 입력값을 분리하여 전달하는 기법은?',['파라미터 바인딩','매개변수 바인딩','parameter binding'],'injection','binding'],
  ['ssrf','dev','SSRF와 서버의 외부 요청','서버가 공격자가 고른 대상으로 요청하도록 유도되는 취약점입니다.','이미지 주소 입력을 받아 서버가 내부 관리자 주소까지 가져오게 되는 경우입니다.','사용자 브라우저에서 요청하는 CSRF와 요청 주체가 다릅니다. 목적지와 리다이렉트 모두 검증해야 합니다.','서버가 공격자가 지정한 내부/외부 대상으로 요청하도록 악용되는 취약점의 약어는?',['SSRF'],'http,authorization','ssrf'],
  ['path-traversal','dev','경로 탐색 취약점','파일 경로 입력을 악용해 허용된 디렉터리 밖의 파일에 접근하는 문제입니다.','상대 경로 구성 요소나 인코딩된 표현으로 상위 디렉터리를 접근하려는 경우입니다.','문자열 앞부분 비교만으로 정규화·심볼릭 링크 이후의 실제 경계를 보장할 수 없습니다.','상위 디렉터리 경로 등을 이용하여 허용 폴더 밖의 파일에 접근하는 취약점은?',['경로 탐색','경로 조작','디렉터리 트래버설','path traversal'],'authorization','security'],
  ['xxe','dev','XML 외부 개체 취약점','안전하지 않은 XML 처리기가 외부 개체를 해석해 파일이나 외부 자원에 접근하는 문제입니다.','외부 개체와 불필요한 DTD 처리를 비활성화하고 안전한 파서 설정을 적용합니다.','XML 구문이 올바르다는 사실과 처리기가 안전하게 구성되었다는 사실은 다릅니다.','XML 외부 개체 해석을 악용하는 취약점의 약어는?',['XXE'],'json','xxe'],
  ['dos','dev','서비스 거부','자원이나 처리 능력을 소모시켜 정상 사용자가 서비스를 이용하지 못하게 합니다.','비싼 요청의 반복으로 작업 큐와 CPU가 고갈될 수 있습니다.','한 입력이 유효해도 요청량 제한·시간 제한이 없으면 자원을 고갈시킬 수 있습니다.','과도한 자원 소비로 정상 사용자에게 서비스를 제공하지 못하게 하는 공격의 약어는?',['DoS'],'performance-test','security'],
  ['symmetric-crypto','dev','대칭키 암호','암호화와 복호화에 대응하는 공유 비밀키를 사용하는 암호 방식입니다.','AES는 대칭키 블록 암호이며 안전한 운영 모드와 키 관리가 함께 필요합니다.','암호화를 했다고 무결성까지 자동 보장되는 것은 아닙니다. 인증 암호 모드 등을 구분합니다.','AES가 속하는 암호 분류는?',['대칭키 암호','대칭 암호'],'encryption','security'],
  ['asymmetric-crypto','dev','비대칭키 암호','공개키와 개인키의 쌍을 사용하는 방식으로 키의 역할은 암호화와 서명 목적에 따라 구분합니다.','수신자 공개키로 암호화한 것을 대응하는 개인키로 복호화할 수 있습니다.','서명과 암호화의 목적을 바꾸어 설명하지 않습니다. RSA는 안전한 패딩도 필요합니다.','공개키·개인키 쌍을 사용하는 암호 분류는?',['비대칭키 암호','공개키 암호'],'encryption,digital-signature','security'],
  ['hmac','dev','HMAC와 공유키 인증','비밀키와 해시 함수를 사용해 메시지 인증 코드를 계산합니다.','송수신자가 공유한 키로 변조 여부와 키 보유자의 메시지임을 검증합니다.','메시지를 숨기는 암호화나 공개키로 검증하는 전자서명과 다릅니다.','해시 함수와 공유 비밀키를 사용하는 메시지 인증 코드 방식은?',['HMAC'],'hashing,encryption','security'],
  ['password-kdf','dev','비밀번호 전용 키 유도','솔트와 비용 파라미터를 사용하는 느린 비밀번호 해시/키 유도 방식으로 추측 비용을 높입니다.','PBKDF2는 반복 횟수로 계산 비용을 조절하며 현재 적용 환경에 맞는 비용을 설정해야 합니다.','빠른 일반 SHA-256 해시만 반복 없이 사용하는 방식과 같은 보호가 아닙니다. Argon2id 등 다른 방식도 있습니다.','이름 끝이 2이며 솔트와 반복 횟수를 사용하는 비밀번호 기반 키 유도 함수는?',['PBKDF2'],'password,hashing','password'],
  ['baseline','dev','형상 기준선','공식 검토·승인되어 이후 변경 관리의 기준이 되는 산출물 집합입니다.','승인된 요구사항과 설계 버전을 묶고 이후 변경 요청의 영향과 승인을 관리합니다.','기준선은 영원히 변경 불가능하다는 뜻이 아니라 변경 절차를 관리한다는 뜻입니다.','검토·승인되어 이후 변경 관리의 기준으로 삼는 형상 상태는?',['기준선','베이스라인','baseline'],'configuration','exam'],
  ['compatibility','dev','배포 호환성과 복구','실행 환경·설정·자료 형식이 새 버전과 이전 버전에 맞는지 확인하고 실패 복구 절차를 준비합니다.','새 DB 열을 이전 코드가 읽을 수 있는지와 백업 복원 가능성을 별도로 검증합니다.','코드 롤백만으로 데이터 손실이나 비호환 스키마가 저절로 복구되지는 않습니다.','새 버전과 기존 환경·데이터 형식이 함께 동작할 수 있는 성질은?',['호환성','compatibility'],'rollback,install-manual','exam'],
  ['srtf','systems','최단 잔여시간 우선','준비된 작업 중 남은 실행 시간이 가장 짧은 작업을 선택하며 더 짧은 작업이 도착하면 선점합니다.','오래 걸리는 작업 실행 중 짧은 작업이 도착하면 잔여시간을 비교합니다.','처음 실행시간만 정렬하는 비선점 SJF와 다릅니다. 동점과 도착 시점 조건을 확인합니다.','가장 짧은 잔여 실행 시간을 선택하는 선점 스케줄링의 약어는?',['SRTF'],'scheduling','os'],
  ['banker','systems','은행원 알고리즘과 안전 상태','현재 가용 자원으로 어떤 작업의 남은 최대 요구를 충족하고 완료 자원을 반환할 수 있는 순서가 있는지 찾습니다.','Need = Max − Allocation이며 완료 후 Work에 기존 할당량을 더합니다.','불안전 상태는 교착이 이미 발생했다는 뜻이 아니라 앞으로의 완료를 보장하는 순서가 없다는 뜻입니다.','최대 요구와 할당·가용량으로 안전 순서를 검사하는 교착 회피 알고리즘은?',['은행원 알고리즘','banker','bankers algorithm'],'deadlock','os'],
];
const built=[];
function add(id,title,group,language,conceptIds,build,variants=5){built.push({id,title,group,language,conceptIds,difficulty:3,variants,build});}
function scenario(prompt,expected,explanation,extra={}){return {prompt,expected,kind:'term',aliases:[expected],explanation,trace:[frame('판단 근거',{reason:explanation},expected)],...extra};}

add('X01','요구사항 추적표의 검증 누락','dev','scenario',['requirements-validation','traceability'],v=>{
  const rows=Array.from({length:5},(_,i)=>['R'+(i+1),'D'+(i+1),i===v?'—':'T'+(i+1)]);
  return scenario('모든 요구사항은 설계와 검증 테스트에 연결되어야 합니다. 설계는 있으나 검증 테스트가 누락된 요구사항 ID를 쓰세요.','R'+(v+1),'설계 연결과 시험 연결을 별도로 확인합니다. 테스트 열의 —는 아직 검증 경로가 없다는 뜻입니다.',{tables:[{name:'요구사항 추적표',headers:['요구사항','설계','테스트'],rows}]});
});
add('X02','UML 관계와 화살표 해석','dev','scenario',['uml-relations','uml-usecase'],v=>{
  const cases=[['하위형에서 상위형으로 향하는 실선·빈 삼각형','일반화','상속을 나타내며 삼각형은 상위형 쪽을 향합니다.',['generalization','일반화']],['전체 쪽의 채운 마름모, 포함된 부분의 생명주기 소유','합성','채운 마름모는 전체 객체 쪽에 놓입니다.',['composition','합성']],['구현 클래스에서 인터페이스로 향하는 점선·빈 삼각형','실체화','계약을 구현하는 실체화는 일반화의 실선과 다릅니다.',['realization','실체화','구현']],['결제 유스케이스가 인증 동작을 항상 포함; 점선 화살표는 인증 쪽','include','include는 포함되는 동작 쪽을 향합니다.',['include','포함']],['할인 처리가 특정 조건에서 결제의 확장 지점에 추가; 화살표는 결제 쪽','extend','extend는 확장 대상인 기본 유스케이스 쪽을 향합니다.',['extend','확장']]][v];
  return scenario('아래 UML 연결 조건이 나타내는 관계 이름을 쓰세요.',cases[1],cases[2],{tables:[{name:'연결 조건',headers:['관찰'],rows:[[cases[0]]]}],aliases:cases[3]});
});
add('X03','다대다 관계의 연결 테이블','db','scenario',['er','candidate-key','fk'],v=>{
  const pairs=[['student_id','course_id'],['author_id','book_id'],['worker_id','project_id'],['order_id','product_id'],['actor_id','film_id']][v];
  return scenario(`두 개체의 다대다 관계를 연결 테이블에 저장합니다. 각 조합은 한 번만 존재하며 추가 식별자 없이 ${pairs.join(', ')} 두 열을 사용합니다. 두 열을 함께 묶어 행을 식별하는 제약의 SQL 키워드를 쓰세요.`,'PRIMARY KEY','두 FK 각각은 여러 번 등장할 수 있지만 두 열의 조합은 유일해야 합니다. 이 조건에서는 복합 기본키로 조합 중복을 막습니다.',{aliases:['PRIMARY KEY','기본키','복합 기본키']});
});
add('X04','분해 관계의 무손실 여부','db','scenario',['lossless','fd'],v=>{
  const fd=['B → A','B → C','A → B','C → B','B → A,C'][v],yes=[true,true,false,false,true][v];
  return scenario(`R(A,B,C)를 R1(A,B), R2(B,C)로 분해합니다. 주어진 함수 종속의 기저는 ${fd}뿐입니다. 모든 허용 데이터에서 분해 후 자연 조인이 원본을 복원하면 '무손실', 보장하지 못하면 '손실'이라고 쓰세요.`,yes?'무손실':'손실','공통 속성은 B입니다. B의 폐포가 AB 또는 BC를 포함해야 이진 분해의 무손실을 보장합니다. 종속의 화살표를 반대로 적용하지 않습니다.');
});
add('X05','연계 실패와 중복 실행 방지','dev','scenario',['idempotence','interface-contract'],v=>{
  const labels=['결제 승인','재고 차감','포인트 지급','예약 확정','계좌 이체'];
  return scenario(`${labels[v]} 요청의 처리는 성공했지만 응답이 유실되었습니다. 서버는 요청 키와 처리 결과를 원자적으로 저장하고 같은 키의 재요청에는 기존 결과를 반환합니다. 재시도할 때 '같은 키'와 '새 키' 중 무엇을 사용해야 하나요?`,'같은 키','같은 업무 요청은 같은 멱등성 키를 재사용해야 기존 처리를 찾아 중복 실행을 피합니다. 단순 네트워크 재시도만으로 중복 부작용을 막을 수 없습니다.',{aliases:['같은 키','동일한 키','동일 키']});
});
add('X06','인터페이스 명세의 검증 오류','dev','scenario',['interface-contract','json'],v=>{
  const fields=[['amount',100,'정수, 원 단위',100.5],['count',2,'1 이상 정수',0],['code','0012','문자열 (앞의 0 보존)',12],['active',true,'불리언','true'],['age',20,'0~150 정수',151]][v];
  return scenario('명세는 아래 한 필드만 받고 조건 위반 시 INVALID_FIELD를 반환합니다. 제출된 값이 이 조건을 만족하면 OK, 아니면 INVALID_FIELD를 쓰세요.','INVALID_FIELD','JSON을 읽는 데 성공한 것과 필드의 자료형·허용 범위를 만족하는 것은 다릅니다.',{tables:[{name:'필드 검증 명세',headers:['필드','규칙','입력(JSON 표현)'],rows:[[fields[0],fields[2],JSON.stringify(fields[3])]]}]});
});
add('X07','모듈 설계의 응집도·결합도','dev','scenario',['cohesion-types','coupling-types'],v=>{
  const cases=[['프로그램 시작 시 서로 무관한 캐시·장치 초기화를 같은 모듈에 묶었다. 응집도 유형은?','시간적 응집도','같은 시점이라는 이유로 묶였습니다.',['시간적 응집도','시간 응집도','temporal cohesion']],['앞 단계의 계산 결과가 다음 단계의 입력이 되도록 모듈을 묶었다. 응집도 유형은?','순차적 응집도','데이터가 단계 사이에 연결됩니다.',['순차적 응집도','순차 응집도','sequential cohesion']],['한 모듈의 모든 동작은 하나의 명확한 계산 기능을 완성한다. 응집도 유형은?','기능적 응집도','하나의 목적을 수행하는 동작들입니다.',['기능적 응집도','기능 응집도','functional cohesion']],['정수 플래그로 다른 모듈 내부의 실행 분기를 선택한다. 결합도 유형은?','제어 결합도','자료형보다 전달값이 제어 흐름을 결정하는 역할인지 봅니다.',['제어 결합도','제어 결합','control coupling']],['일부 필드만 필요한 모듈에 전체 레코드 구조를 전달한다. 결합도 유형은?','스탬프 결합도','전체 자료구조에 의존하도록 전달했습니다.',['스탬프 결합도','자료구조 결합도','stamp coupling']]][v];
  return scenario(cases[0],cases[1],cases[2],{aliases:cases[3]});
});
add('X08','화면 설계와 오류 복구','dev','scenario',['ui-accessibility','storyboard'],v=>{
  const cases=[['HTML의 <label ___="email">과 <input id="email">을 연결하려면 빈칸 속성은?','for','보이는 label과 입력의 이름을 명시적으로 연결합니다.'],['검색 결과가 0건인 화면에서 사용자가 다시 검색할 수 있도록 유지할 입력은?','검색 조건','빈 결과에서도 입력 조건을 수정하는 경로가 있어야 합니다.'],['저장 요청이 실패했습니다. 사용자가 이미 쓴 답안과 입력값을 지우지 않고 보존하며 다시 시도하도록 해야 합니다. 우선 보존할 대상은?','입력값','실패로 사용자의 작업까지 잃지 않도록 설계합니다.'],['경고 상태를 빨간색만으로 나타냈습니다. 색 구별이 어려워도 의미를 알도록 함께 보여 줄 것은?','텍스트','색 외에도 오류 내용을 텍스트로 전달합니다.'],['마우스를 쓸 수 없는 사용자도 화면 기능을 조작해야 합니다. Tab 이동과 활성화로 접근하도록 지원해야 할 입력 수단은?','키보드','키보드 접근성과 초점의 표시·순서를 함께 확인합니다.']][v];
  return scenario(cases[0],cases[1],cases[2],{aliases:[cases[1],...({'검색 조건':['검색어'],'입력값':['입력 내용','답안'],'텍스트':['문자','설명'],'키보드':['keyboard']}[cases[1]]??[])]});
});
add('X09','MC/DC를 만족하는 최소 집합','dev','calculation',['mcdc','coverage'],v=>{
  const names=['A AND B','A OR B','(NOT A) AND B','A AND (NOT B)','A OR (NOT B)'],decisions=[(a,b)=>a&&b,(a,b)=>a||b,(a,b)=>!a&&b,(a,b)=>a&&!b,(a,b)=>a||!b],inputs=[[true,true],[true,false],[false,true],[false,false]],results=inputs.map(r=>decisions[v](...r)),rows=inputs.map((r,i)=>['T'+(i+1),...r.map(x=>x?'T':'F'),results[i]?'T':'F']),pairs={};
  for(const [key,c]of [['A',0],['B',1]])for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(inputs[i][c]!==inputs[j][c]&&inputs[i][1-c]===inputs[j][1-c]&&results[i]!==results[j])pairs[key]=`T${i+1}↔T${j+1}`;
  return {prompt:`두 독립 불리언 조건 A, B의 결정식은 ${names[v]}입니다. 아래 후보 중 다른 조건을 고정한 채 한 조건만 바꾸어 결정 결과도 바뀌는 쌍을 A와 B 각각에 제공해야 합니다. 두 조건의 MC/DC를 충족하는 최소 테스트 개수를 쓰세요.`,tables:[{name:'조건과 결정 결과',headers:['ID','A','B','결정'],rows}],kind:'number',expected:'3',trace:[frame('각 조건의 독립 영향',pairs,'3')],explanation:'참·거짓만 등장하는 두 테스트로는 다른 조건을 고정한 독립 영향 쌍을 두 조건 모두에 제공할 수 없습니다. 공유하는 기준 테스트와 두 변화 테스트가 필요합니다.'};
});
add('X10','성능 측정에서 병목 찾기','dev','scenario',['performance-test'],v=>{
  const names=['인증','업무 로직','DB','외부 API','직렬화'],times=names.map((_,i)=>i===v?180:10+i*3);
  return scenario('같은 요청을 순차 처리한 각 구간의 소요 시간입니다. 다른 조건은 같다고 할 때 한 요청의 지연을 가장 많이 줄일 후보 구간의 이름을 표에 나온 그대로 쓰세요.',names[v],'이 측정에서는 가장 오래 걸린 구간부터 조사합니다. 이 결과만으로 원인이나 동시 요청 처리량까지 확정하지 않습니다.',{tables:[{name:'순차 요청 측정',headers:['구간','시간(ms)'],rows:names.map((n,i)=>[n,times[i]])}]});
});
add('X11','취약 SQL 코드의 바인딩 수정','dev','scenario',['secure-binding','injection'],v=>{
  const names=['user_name','email','code','city','tag'],column=names[v];
  return scenario('아래 JDBC 코드에서 사용자 입력을 SQL 문장에 연결하지 않고 ? 값으로 바인딩하려 합니다. 문자열 값을 전달할 메서드 이름 한 개를 빈칸에 쓰세요.','setString','PreparedStatement는 SQL 구조를 고정하고 입력을 값으로 전달합니다. Java 메서드명은 대소문자를 구분하므로 setstring은 setString과 다른 이름입니다. 인증·인가와 다른 입력 검증도 별도로 필요합니다.',{kind:'identifier',dialect:'Java JDBC (발췌)',code:`PreparedStatement ps = conn.prepareStatement(\n  "SELECT id FROM users WHERE ${column} = ?");\nps.___(1, input);`,aliases:['setString']});
});
add('X12','보안 사례에서 취약점 구별','dev','scenario',['ssrf','path-traversal','xxe','csrf','dos'],v=>{
  const cases=[['서버가 사용자가 입력한 URL의 문서를 대신 가져오는데, 내부 관리 서버 주소로도 요청할 수 있습니다.','SSRF','요청의 주체가 서버이며 목적지가 공격자의 입력에 의해 선택됩니다.',['SSRF']],['다운로드 파일명을 외부에서 받고 정규화된 경계를 검사하지 않아 상위 폴더의 파일이 열립니다.','경로 탐색','파일 경로를 통해 허용된 저장소 밖으로 접근합니다.',['경로 탐색','path traversal','디렉터리 트래버설']],['XML 파서가 외부 개체를 해석하여 공격자가 지정한 로컬 파일 내용을 응답에 포함합니다.','XXE','외부 개체 처리가 불필요하면 비활성화하고 안전한 파서를 사용합니다.',['XXE']],['로그인 세션 쿠키를 가진 브라우저가 외부 사이트의 요청으로 의도하지 않은 계정 변경을 수행합니다.','CSRF','인증된 브라우저의 원하지 않는 상태 변경 요청입니다.',['CSRF']],['비싼 계산 요청을 반복하여 작업 큐를 고갈시키고 정상 사용자의 처리를 막습니다.','DoS','입력 형식이 유효해도 요청량과 처리 비용 제한이 필요합니다.',['DoS','서비스 거부']]][v];
  return scenario(cases[0]+' 이 취약점 또는 공격의 이름은?',cases[1],cases[2],{aliases:cases[3]});
});
add('X13','암호 도구와 목적의 대응','dev','scenario',['symmetric-crypto','asymmetric-crypto','hmac','password-kdf','hashing'],v=>{
  const cases=[['대칭키 블록 암호','AES','AES는 안전한 모드와 키 관리도 함께 선택해야 합니다.'],['공개키·개인키 쌍을 이용하는 알고리즘','RSA','RSA는 목적에 맞는 안전한 패딩과 키 길이를 사용합니다.'],['공유 비밀키를 사용하는 메시지 인증','HMAC','암호화가 아니라 비밀키 기반 메시지 인증입니다.'],['솔트와 반복 비용을 사용하는 비밀번호 기반 키 유도','PBKDF2','빠른 일반 해시만으로 비밀번호를 저장하는 것과 다릅니다.'],['키 없이 메시지의 고정 길이 해시를 계산','SHA-256','해시 하나만으로 송신자 인증이나 기밀성을 제공하지는 않습니다.']][v];
  return scenario(`다섯 후보 AES·RSA·HMAC·PBKDF2·SHA-256 중 '${cases[0]}'에 해당하는 것을 쓰세요.`,cases[1],cases[2]);
});
add('X14','배포 실패의 복구 계획','dev','scenario',['compatibility','rollback','transaction'],v=>{
  const cases=[['비가역 데이터 변환이 이미 확정되어 이전 코드가 읽을 수 없습니다. 사전 검증된 복구 계획에서 코드 복귀와 함께 사용할 이전 데이터의 사본은?','백업','코드만 되돌려서는 변환된 데이터를 복원하지 못합니다.'],['새 스키마를 이전 코드가 읽을 수 있는지 배포 전에 검사할 성질은?','호환성','코드와 데이터 형식의 호환성을 분리해 확인합니다.'],['DB 변경이 아직 같은 트랜잭션 안에 있고 실패했습니다. 두 UPDATE를 모두 취소하는 SQL 명령은?','ROLLBACK','확정 전 변경을 해당 트랜잭션에서 취소합니다.'],['새 버전 응답 오류가 증가해 사전 계획에 따라 이전 안정 버전으로 되돌리는 절차는?','롤백','복구 조건·버전·데이터 영향도 함께 계획해야 합니다.'],['배포 후 핵심 기능을 점검해 설치 성공 여부를 확인하는 짧은 기본 기능 시험의 이름은?','스모크 테스트','설치 완료 메시지만 보지 말고 기본 기능을 검증합니다.']][v];
  return scenario(cases[0],cases[1],cases[2],{aliases:[cases[1],...({'백업':['backup'],'호환성':['compatibility'],'롤백':['rollback'],'스모크 테스트':['smoke test','smoke testing']}[cases[1]]??[])]});
});
add('X15','형상 변경의 승인 절차','dev','scenario',['baseline','configuration'],v=>{
  const cases=[['검토·승인한 요구사항과 설계의 버전 묶음을 이후 변경 관리의 기준으로 삼습니다. 이 상태의 이름은?','기준선','승인된 기준 이후의 변경을 통제합니다.'],['기준선 변경 요청에 대해 비용·일정·관련 산출물 영향을 조사한 뒤 허용 여부를 결정합니다. 적용 전에 필요한 의사결정은?','변경 승인','요청이 접수되었다는 사실과 변경이 승인되었다는 사실을 구분합니다.'],['승인된 v1.2 산출물을 재현하려면 파일 최신본이 아니라 각 파일의 무엇을 식별해야 하나요?','버전','하나의 배포에 속한 각 산출물 버전을 고정합니다.'],['수정된 요구사항 때문에 설계와 시험의 변경 범위를 찾을 때 사용하는 연결 정보는?','추적성','요구·설계·테스트의 연결로 영향을 추적합니다.'],['기준선에 속한 코드와 문서를 승인 기록 없이 직접 바꿨습니다. 누락된 통제 활동은?','변경 관리','기준선을 바꿀 수 있지만 정해진 변경 관리 절차를 따라야 합니다.']][v];
  return scenario(cases[0],cases[1],cases[2],{aliases:[cases[1],...({'기준선':['baseline','베이스라인'],'버전':['revision','리비전'],'추적성':['traceability']}[cases[1]]??[])]});
});
add('X16','설치·사용자 매뉴얼의 누락','dev','scenario',['install-manual','release-notes','compatibility'],v=>{
  const cases=[['설치 전에 필요한 OS·런타임 버전·디스크 용량을 안내하지 않았습니다. 설치 매뉴얼에서 빠진 항목은?','사전 요구사항','설치 가능 환경과 의존성을 먼저 확인하도록 안내합니다.'],['설치 명령은 있지만 정상 작동을 확인하는 방법이 없습니다. 빠진 절차는?','검증','설치 후 기본 기능과 결과를 확인하는 기준이 필요합니다.'],['기존 버전의 데이터 변환이 필요한데 릴리즈 노트에 이를 알리지 않았습니다. 빠진 변경 영향은?','데이터 이전','업데이트 시 기존 데이터의 이전 필요성과 복구 영향을 안내합니다.'],['오류 발생 시 로그 확인 위치와 이전 상태 복원 방법이 없습니다. 빠진 절차는?','문제 해결','실패 시 진단과 복구할 수 있는 절차를 안내합니다.'],['시스템을 안전하게 제거할 방법과 보존할 데이터의 안내가 없습니다. 빠진 절차는?','제거','제거 시 사용자 데이터 처리와 재설치 영향을 명확히 합니다.']][v];
  return scenario(cases[0],cases[1],cases[2],{aliases:[cases[1],...({'사전 요구사항':['설치 요구사항','시스템 요구사항'],'검증':['설치 검증'],'데이터 이전':['마이그레이션'],'문제 해결':['장애 대응','트러블슈팅'],'제거':['설치 제거','삭제']}[cases[1]]??[])]});
});
add('X17','DCL 명령 직접 작성','db','scenario',['dcl-authority','sql-dcl'],v=>{
  const table=['reports','orders','items','profiles','events'][v],privilege=v%2?'UPDATE':'SELECT',grant=v<3,expected=`${grant?'GRANT':'REVOKE'} ${privilege} ON TABLE ${table} ${grant?'TO':'FROM'} analyst;`;
  return {prompt:`PostgreSQL 문법으로 analyst 역할에 ${table} 테이블의 ${privilege} 권한을 ${grant?'부여':'회수'}하는 명령 한 문장을 쓰세요. 객체는 TABLE을 명시하고 추가 옵션 없이 작성합니다.`,expected,kind:'tokens',dialect:'PostgreSQL DCL',reference:grant?'grant':'revoke',validation:'native-dialect',trace:[frame('권한·객체·대상을 분리',{command:grant?'GRANT':'REVOKE',direction:grant?'TO':'FROM'},expected)],explanation:'객체 종류·권한·역할을 구분합니다. GRANT는 TO, REVOKE는 FROM을 사용합니다. 권한 회수 뒤에도 다른 역할을 통해 받은 권한이 남아 있을 수 있으므로 경로를 함께 확인합니다.'};
});
add('X18','저장 프로시저 문법 완성','db','scenario',['procedure'],v=>{
  const codes=[['CREATE PROCEDURE add_one(___ x INT, OUT y INT)\nBEGIN\n  SET y = x + 1;\nEND','IN','x는 호출자가 전달하는 입력 인수입니다.'],['CREATE PROCEDURE add_one(IN x INT, ___ y INT)\nBEGIN\n  SET y = x + 1;\nEND','OUT','y는 호출자에게 결과를 전달하는 출력 인수입니다.'],['CREATE PROCEDURE increase(INOUT x INT)\nBEGIN\n  ___ x = x + 1;\nEND','SET','변수에 새 값을 대입하는 SET 문장입니다.'],['CREATE PROCEDURE local_value()\nBEGIN\n  ___ total INT DEFAULT 0;\n  SET total = total + 1;\nEND','DECLARE','지역 변수 선언은 실행 문장보다 앞에 배치합니다.'],['CREATE PROCEDURE absolute_value(IN x INT, OUT y INT)\nBEGIN\n  ___ x < 0 THEN\n    SET y = -x;\n  ELSE\n    SET y = x;\n  END IF;\nEND','IF','조건 분기는 IF ... THEN ... ELSE ... END IF로 구성합니다.']][v];
  return scenario('MySQL 8.4 저장 프로시저 정의에서 ___에 들어갈 키워드 한 개를 쓰세요. 클라이언트 DELIMITER 설정은 생략했습니다.',codes[1],codes[2],{code:codes[0],dialect:'MySQL 8.4',reference:'routine',validation:'native-dialect'});
});
add('X19','저장 함수와 호출의 구별','db','scenario',['stored-function','procedure'],v=>{
  const cases=[['CREATE FUNCTION plus_one(x INT) ___ INT\nDETERMINISTIC\nRETURN x + 1','RETURNS','함수의 반환 자료형을 선언합니다.'],['CREATE FUNCTION plus_one(x INT) RETURNS INT\nDETERMINISTIC\n___ x + 1','RETURN','반환값을 돌려주는 문장입니다.'],['CREATE ___ plus_one(x INT) RETURNS INT\nDETERMINISTIC\nRETURN x + 1','FUNCTION','값을 반환하는 함수 정의입니다.'],['___ add_one(3, @result);','CALL','프로시저 호출은 CALL을 사용합니다.'],['___ plus_one(3);','SELECT','정의된 저장 함수를 SELECT의 식으로 호출할 수 있습니다.']][v];
  return scenario('MySQL 8.4 코드의 ___에 들어갈 키워드 한 개를 쓰세요. plus_one 함수와 add_one 프로시저는 적절히 정의되어 있다고 가정합니다.',cases[1],cases[2],{code:cases[0],dialect:'MySQL 8.4',reference:'routine',validation:'native-dialect'});
});

add('S11','집계 SQL 직접 작성','db','sql',['sql-group','sql-select'],v=>{
  const rows=[[1,'A',10+v],[2,'A',20+v],[3,'B',8+v]],threshold=25+v,expected=`SELECT team, SUM(score) FROM scores GROUP BY team HAVING SUM(score) >= ${threshold} ORDER BY team;`,result=[['A',30+2*v]];
  return {prompt:`scores에서 team별 score 합계를 조회하세요. 결과 열은 team, SUM(score) 순서, 합계 ${threshold} 이상인 팀만, team 오름차순입니다. 별칭 없이 SELECT·FROM·GROUP BY·HAVING·ORDER BY 순서로 한 문장을 작성합니다. 대소문자·공백·마지막 세미콜론은 채점에 영향을 주지 않습니다.`,kind:'tokens',expected,aliases:[expected,expected.replace('ORDER BY team','ORDER BY team ASC')],nativeCode:expected,nativeExpected:textRows(result),schema:'CREATE TABLE scores(id INTEGER, team TEXT, score INTEGER);\nINSERT INTO scores VALUES '+rows.map(r=>`(${r[0]},'${r[1]}',${r[2]})`).join(',')+';',dialect:'SQLite',tables:[{name:'scores',headers:['id','team','score'],rows}],trace:[frame('팀별 합계 계산',{A:30+2*v,B:8+v}),frame('집계 후 조건과 정렬',{condition:`SUM(score) >= ${threshold}`},expected)],explanation:'행을 묶어 집계한 결과를 HAVING으로 검사합니다. WHERE는 집계 전 행 조건입니다. 지정된 문장 형태와 검토한 별칭만 채점하며 임의의 동치 SQL을 판정하지 않습니다.'};
});
add('S12','무결성 제약의 DDL 작성','db','sql',['sql-ddl','pk'],v=>{
  const table='product'+(v+1),lower=v*2,expected=`CREATE TABLE ${table} (id INTEGER PRIMARY KEY, price INTEGER NOT NULL CHECK (price >= ${lower}));`;
  return {prompt:`SQLite에서 ${table} 테이블을 만드는 한 문장을 작성하세요. 열 순서는 id, price이며 둘 다 INTEGER입니다. id는 열 수준 PRIMARY KEY, price는 열 수준 NOT NULL 다음 CHECK (price >= ${lower}) 제약을 씁니다. 별도의 테이블 수준 제약이나 추가 옵션은 사용하지 않습니다.`,expected,kind:'tokens',nativeSetup:expected+`\nINSERT INTO ${table} VALUES (1,${lower}),(2,${lower+5});`,nativeCode:`SELECT COUNT(*), SUM(price) FROM ${table};`,nativeExpected:`2|${2*lower+5}`,schema:'',dialect:'SQLite',trace:[frame('열과 제약을 구성',{id:'INTEGER PRIMARY KEY',price:`INTEGER NOT NULL CHECK (price >= ${lower})`},expected)],explanation:'기본키는 행 식별, NOT NULL은 NULL 방지, CHECK는 허용값 검사입니다. CHECK만으로 NULL을 막는다고 보지 않습니다. 지정한 형태의 DDL을 연습합니다.'};
});
add('S13','조건부 UPDATE 직접 작성','db','sql',['sql-dml','sql-select'],v=>{
  const k=v+3,rows=[[1,'A team',10],[2,'B team',20],[3,'A team',5]],expected=`UPDATE stock SET qty = qty + ${k} WHERE team = 'A team';`,after=rows.map(r=>[r[0],r[2]+(r[1]==='A team'?k:0)]);
  return {prompt:`stock에서 team이 문자열 'A team'과 같은 행만 qty를 ${k}만큼 늘리는 UPDATE 한 문장을 쓰세요. qty = qty + ${k} 형태를 사용하며 나머지 행은 바꾸지 않습니다.`,expected,kind:'tokens',nativeSetup:expected,nativeCode:'SELECT id, qty FROM stock ORDER BY id;',nativeExpected:textRows(after),schema:"CREATE TABLE stock(id INTEGER, team TEXT, qty INTEGER);\nINSERT INTO stock VALUES (1,'A team',10),(2,'B team',20),(3,'A team',5);",dialect:'SQLite',tables:[{name:'stock',headers:['id','team','qty'],rows}],trace:[frame('조건에 맞는 행만 선택',{ids:'1, 3'}),frame('각 행의 기존 값에 증가량을 더함',{delta:k},expected)],explanation:'WHERE를 빼면 모든 행이 변경됩니다. 문자열 안의 공백과 대소문자는 조건값의 일부입니다. 사용자 답안을 실행하지 않고 지정한 문법의 토큰을 비교합니다.'};
});
add('C08','이진 탐색의 경계 이동','code','c',['arrays','branches','time-complexity'],v=>{
  const a=[2,5,9,13,18,24,31,40].map(x=>x+v),target=v%2?a[2+v%5]:10+v;let lo=0,hi=7,index=-1,trace=[];
  while(lo<=hi){const mid=Math.floor((lo+hi)/2);trace.push(frame('중간값과 경계',{lo,hi,mid,value:a[mid],target}));if(a[mid]===target){index=mid;break;}if(a[mid]<target)lo=mid+1;else hi=mid-1;}
  const code=`#include <stdio.h>\nint main(void) {\n  int a[] = {${a.join(', ')}}, target = ${target};\n  int lo = 0, hi = 7, found = -1;\n  while (lo <= hi) {\n    int mid = (lo + hi) / 2;\n    if (a[mid] == target) { found = mid; break; }\n    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n  printf("%d", found);\n  return 0;\n}`;
  return {code,expected:String(index),trace,explanation:'정렬된 배열에서 탐색 구간을 좁힙니다. 같은 중간 위치가 반복되지 않도록 mid±1로 경계를 움직이며 찾지 못하면 -1입니다.'};
},8);
add('C09','연결 리스트와 포인터 변경','code','c',['structs','pointers'],v=>{
  const n=3+v,code=`#include <stdio.h>\nstruct Node { int value; struct Node *next; };\nint main(void) {\n  struct Node c = {${n+6}, NULL};\n  struct Node b = {${n+3}, &c};\n  struct Node a = {${n}, &b};\n  struct Node *p = a.next;\n  p->next->value += a.value;\n  a.next = p->next;\n  printf("%d %d %d", a.value, a.next->value, b.value);\n  return 0;\n}`;
  return {code,expected:`${n} ${2*n+6} ${n+3}`,trace:[frame('초기 연결',{a:'a → b → c',p:'b'}),frame('p의 다음 노드는 c',{c:2*n+6}),frame('a가 c로 바로 연결',{a:'a → c',b:n+3})],explanation:'포인터 링크를 바꾸는 것과 노드 값 변경은 다릅니다. b는 지역 객체로 계속 존재하지만 a.next의 경로에서는 건너뜁니다.'};
},8);
add('J07','재정의와 정적 자료형의 결합','code','java',['overriding','overloading','inheritance'],v=>{
  const n=2+v,code=`class Base {\n  int f(int x) { return x + 1; }\n  int f(String x) { return x.length(); }\n}\nclass Child extends Base {\n  @Override int f(int x) { return x * 2; }\n}\npublic class Main {\n  public static void main(String[] args) {\n    Base a = new Child();\n    System.out.print(a.f(${n}) + " " + a.f("ab") + " " + new Base().f(${n}));\n  }\n}`;
  return {code,expected:`${2*n} 2 ${n+1}`,trace:[frame('정수 인수 메서드 선택',{signature:'f(int)',runtime:'Child'}),frame('문자열 인수는 상속된 메서드',{signature:'f(String)',result:2}),frame('Base 객체의 정수 메서드',{result:n+1})],explanation:'오버로딩은 인수의 형식으로 선택하고 선택된 인스턴스 메서드의 재정의는 실제 객체로 결정합니다. Child는 f(String)을 재정의하지 않았습니다.'};
},8);
add('P07','얕은 복사와 중첩 정렬','code','python',['py-sequence','sort'],v=>{
  const n=2+v,code=`a = [[${n}, 2], [${n+3}, 1]]\nb = a.copy()\nb[0][0] += 4\nb.append([0, 3])\nb.sort(key=lambda row: row[1])\nprint(a)\nprint(b)`;
  return {code,expected:`[[${n+4}, 2], [${n+3}, 1]]\n[[${n+3}, 1], [${n+4}, 2], [0, 3]]`,trace:[frame('바깥 리스트는 복사, 내부 리스트는 공유',{shared:'a[0]와 b[0]'}),frame('공유된 내부 값 변경',{value:n+4}),frame('b의 바깥 구조만 추가·재정렬',{aRows:2,bRows:3})],explanation:'얕은 복사는 내부 요소의 참조를 공유합니다. 내부 값 변경은 양쪽에 보이지만 b.append와 b의 바깥 정렬은 a의 바깥 구조를 바꾸지 않습니다.'};
},8);

const srtfCases=[[[0,7],[2,4],[4,1]],[[0,5],[1,2],[2,1]],[[0,8],[1,4],[2,2]],[[0,4],[3,2],[4,1]],[[0,3],[0,2],[1,1]]];
function simulateSrtf(jobs){const left=jobs.map(j=>j[1]),done=[],events=[];let time=0;
  while(done.filter(x=>x!==undefined).length<jobs.length){const ids=left.map((r,i)=>i).filter(i=>left[i]>0&&jobs[i][0]<=time).sort((a,b)=>left[a]-left[b]||jobs[a][0]-jobs[b][0]||a-b);if(!ids.length){time++;continue;}const id=ids[0];left[id]--;events.push('P'+(id+1));time++;if(!left[id])done[id]=time;}
  return {waits:done.map((t,i)=>t-jobs[i][0]-jobs[i][1]),events,done};
}
add('N09','도착 시점이 다른 SRTF','systems','calculation',['srtf','scheduling'],v=>{
  const jobs=srtfCases[v],r=simulateSrtf(jobs),total=r.waits.reduce((a,b)=>a+b,0);
  return {prompt:'아래 작업을 SRTF로 처리합니다. 동점은 먼저 도착한 작업, 그 뒤 작은 ID를 우선합니다. 문맥 전환 비용은 0입니다. 모든 작업의 총 대기시간을 쓰세요.',tables:[{name:'작업',headers:['ID','도착','실행시간'],rows:jobs.map((j,i)=>['P'+(i+1),...j])}],kind:'number',expected:String(total),trace:[frame('매 단위 시간 선택',{timeline:r.events.join(' → ')}),frame('대기=완료−도착−실행',{waits:r.waits.join(', ')},String(total))],explanation:'각 도착 순간 현재 작업의 잔여시간과 새 작업을 비교합니다. 총 소요시간이 아니라 작업별 완료−도착−실행을 합합니다.'};
});
function simulateRr(jobs,q){const left=jobs.map(j=>j[1]),seen=new Set(),queue=[],done=[],events=[];let time=0;const arrive=()=>{for(let i=0;i<jobs.length;i++)if(!seen.has(i)&&jobs[i][0]<=time){queue.push(i);seen.add(i);}};
  while(done.filter(x=>x!==undefined).length<jobs.length){arrive();if(!queue.length){time++;continue;}const id=queue.shift(),span=Math.min(q,left[id]);for(let k=0;k<span;k++){left[id]--;events.push('P'+(id+1));time++;arrive();}if(left[id])queue.push(id);else done[id]=time;}
  return {events,waits:done.map((t,i)=>t-jobs[i][0]-jobs[i][1])};
}
add('N10','도착과 재삽입을 고려한 RR','systems','calculation',['rr-scheduling','scheduling'],v=>{
  const jobs=v===4?[[0,4],[2,3],[1,1]]:[[0,4],[1,3],[2,1]],quantum=[1,2,3,4,2][v],r=simulateRr(jobs,quantum),total=r.waits.reduce((a,b)=>a+b,0);
  return {prompt:`RR의 시간 할당량은 ${quantum}입니다. 준비 큐는 FIFO이며 실행 구간 중 도착한 작업은 도착 순서로 큐에 넣습니다. 할당량 끝 시각의 새 도착도 만료 작업의 재삽입보다 먼저 넣습니다. 문맥 전환 비용은 0입니다. 총 대기시간을 쓰세요.`,tables:[{name:'작업',headers:['ID','도착','실행시간'],rows:jobs.map((j,i)=>['P'+(i+1),...j])}],kind:'number',expected:String(total),trace:[frame('CPU 실행 단위열',{timeline:r.events.join(' → ')}),frame('작업별 대기시간 합',{waits:r.waits.join(', ')},String(total))],explanation:'시간 할당량과 도착/재삽입 순서가 결과에 영향을 줍니다. 실행 중 도착도 큐에 반영하고 완료 작업은 다시 넣지 않습니다.'};
});
add('N11','은행원 알고리즘의 안전 순서','systems','calculation',['banker','deadlock'],v=>{
  const allocation=[1+v,2+v,1+v],need=v%2?[2+v,2+v,3+v]:[1+v,2+v,3+v],available=v%2?1+v:2+v;let work=available;const done=new Set(),order=[];let changed=true;
  while(changed){changed=false;for(let i=0;i<3;i++)if(!done.has(i)&&need[i]<=work){work+=allocation[i];done.add(i);order.push('P'+(i+1));changed=true;}}
  const expected=done.size===3?'안전':'불안전';return scenario(`한 종류의 자원만 있습니다. 가용량은 ${available}, 각 작업의 현재 할당량과 남은 최대 요구량은 표와 같습니다. 은행원 알고리즘에서 전체 작업의 완료를 보장하는 순서가 있으면 '안전', 없으면 '불안전'이라고 쓰세요.`,expected,'Need 이하의 Work로 완료 가능한 작업을 찾고 완료하면 기존 할당량을 Work에 반환합니다. 불안전은 이미 교착이라는 뜻은 아닙니다.',{tables:[{name:'자원 상태',headers:['ID','Allocation','Need'],rows:allocation.map((a,i)=>['P'+(i+1),a,need[i]])}],trace:[frame('가용량으로 완료 가능한 작업부터 검사',{order:order.join(' → ')||'시작할 수 있는 작업 없음',finalWork:work},expected)]});
});
add('N12','라우팅 표의 최장 프리픽스','systems','calculation',['routing','subnet'],v=>{
  const ip=['10.4.8.35','10.4.8.150','10.4.9.9','10.5.1.1','192.168.1.8'][v],expected=['C','D','B','A','E'][v];
  return scenario(`목적지 IPv4 주소가 ${ip}입니다. 표에서 일치하는 가장 긴 프리픽스의 다음 홉 이름 A~E 중 하나를 쓰세요.`,expected,'먼저 각 네트워크 범위에 목적지가 들어가는지 확인하고, 일치한 경로 중 / 뒤 숫자가 가장 큰 것을 고릅니다.',{tables:[{name:'라우팅 표',headers:['목적지 네트워크','다음 홉'],rows:[['10.0.0.0/8','A'],['10.4.0.0/16','B'],['10.4.8.0/24','C'],['10.4.8.128/25','D'],['0.0.0.0/0','E']]}]});
});
export const caseFamilies=Object.freeze(built);
