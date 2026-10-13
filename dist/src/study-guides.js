// Original reading strategies, linked to the existing verified question bank.
export const studyGuides=Object.freeze([
  {
    id:'code',title:'코드: 값과 참조를 따로 추적하기',goal:'머릿속으로 한꺼번에 실행하지 않고, 바뀐 값과 연결을 적으며 출력을 구합니다.',
    example:'P01.0',practice:'P01.1',reference:'python',
    selfCheck:'리스트의 바깥쪽만 복사했을 때 안쪽 객체를 바꾸는 것과, 안쪽 객체 자체를 새 값으로 교체하는 것은 왜 다를까요?',
    explanation:'얕은 복사는 새 바깥 컨테이너를 만들지만 안쪽 객체의 참조는 공유합니다. 공유 객체의 내용 변경은 양쪽에서 보이고, 한 컨테이너의 원소를 다른 객체로 교체하면 그 칸의 연결만 바뀝니다.',
    steps:[
      {title:'변수와 저장된 값을 적습니다',text:'변수 이름마다 현재 값을 한 칸씩 적습니다. 배열은 인덱스를 붙이고, 객체를 가리키는 변수는 객체 이름으로 연결합니다. 같은 이름의 지역변수는 호출별로 구분하세요.',concepts:['variables','arrays','objects'],question:'C01.0'},
      {title:'대입과 객체 변경을 구분합니다',text:'참조를 다른 객체로 바꾸는지, 이미 가리키던 객체의 내용을 바꾸는지 확인합니다. C의 포인터 이동은 가리키는 자료형의 원소 단위이고, Python의 얕은 복사는 안쪽 객체까지 복제하지 않습니다.',concepts:['pointers','py-sequence'],question:'C07.0'},
      {title:'호출과 반환을 쌓아 씁니다',text:'재귀 호출은 아직 반환하지 않은 식을 남겨두고, 종료 조건에 도달한 뒤 아래에서 위로 값을 채웁니다. Java는 오버로딩 선택과 재정의된 메서드 실행을 나누어 판단하세요.',concepts:['recursion','overloading','overriding'],question:'J07.0'},
      {title:'출력 시점의 값만 모읍니다',text:'반복문이 끝난 뒤의 값과 반복 중에 출력한 값을 섞지 않습니다. 마지막에는 공백·줄바꿈·대소문자를 포함해 출력 순서대로 옮깁니다.',concepts:['loops','strings'],question:'C04.0'},
    ],
  },
  {
    id:'data',title:'데이터 설계: 키와 종속에서 출발하기',goal:'정규형 이름을 외우기 전에 무엇이 무엇을 결정하는지 확인합니다.',
    example:'D02.0',practice:'D02.1',reference:'design',
    selfCheck:'R(A, B, C)에 A → B, B → C가 있고 후보키가 A라면, 2정규형이어도 3정규형은 아닐 수 있나요?',
    explanation:'그렇습니다. 후보키 A가 단일 속성이므로 키의 일부에 대한 부분 종속은 없습니다. 하지만 B는 슈퍼키가 아니고 C도 후보키에 포함되지 않는 속성이므로 B → C가 3정규형 조건을 위반합니다.',
    steps:[
      {title:'업무 규칙을 함수 종속으로 씁니다',text:'같은 X값이면 Y값도 같아야 한다는 규칙을 X → Y로 표시합니다. 우연히 중복이 없는 몇 개의 표본 행만 보고 영구적인 규칙이라고 단정하지 않습니다.',concepts:['relational','fd'],question:'D02.0'},
      {title:'폐포로 후보키를 찾습니다',text:'선택한 속성에서 시작해 함수 종속으로 얻을 수 있는 속성을 계속 추가합니다. 모든 속성이 나오면 슈퍼키이며, 하나라도 빼면 불가능한 최소 집합이 후보키입니다.',concepts:['candidate-key','pk'],question:'X03.0'},
      {title:'문제가 되는 종속을 찾습니다',text:'2정규형은 후보키의 일부에 대한 비주요 속성의 부분 종속을 살핍니다. 3정규형은 각 비자명한 X → A에서 X가 슈퍼키이거나 A가 주요 속성인지 확인합니다. BCNF는 비자명한 함수 종속의 결정자가 슈퍼키여야 합니다.',concepts:['normal-2nf','normal-3nf','normal-bcnf'],question:'D02.2'},
      {title:'분해 후 다시 합쳐봅니다',text:'표를 나눈 뒤 조인했을 때 원래 없던 행이 생기지 않는지 확인합니다. 두 관계로 나눌 때 공통 속성이 한쪽 관계를 결정하면 무손실 조건을 만족합니다. 종속성 보존은 별도로 살펴봅니다.',concepts:['lossless','er','fk'],question:'X04.0'},
    ],
  },
  {
    id:'sql',title:'SQL: 행이 줄고 묶이는 순서 따라가기',goal:'문장 전체를 암기하지 않고 각 처리 단계의 중간 표를 만들어 결과를 구합니다.',
    example:'S01.0',practice:'S01.1',reference:'sql',
    selfCheck:'LEFT JOIN에서 오른쪽에 대응하는 행이 없을 때 COUNT(*)와 COUNT(오른쪽의 NULL이 될 수 있는 열)는 같은 값을 내나요?',
    explanation:'같지 않을 수 있습니다. 외부 조인이 남긴 행 자체는 COUNT(*)에 포함됩니다. COUNT(열)은 해당 열이 NULL인 행을 세지 않습니다. 오른쪽의 원래 데이터에도 NULL이 있을 수 있으므로 어떤 열을 세는지도 확인해야 합니다.',
    steps:[
      {title:'FROM과 JOIN으로 중간 표를 만듭니다',text:'조인 조건을 만족하는 조합을 적고 일대다 관계에서는 행이 늘어나는지 확인합니다. LEFT JOIN의 대응 없는 왼쪽 행에는 오른쪽 열을 NULL로 채웁니다.',concepts:['sql-join','fk'],question:'S01.0'},
      {title:'WHERE에서 개별 행을 걸러냅니다',text:'WHERE는 참인 행만 남깁니다. NULL과의 일반 비교는 참으로 판정되지 않으며, NULL 여부는 IS NULL로 확인합니다. 외부 조인의 오른쪽 열을 WHERE에서 제한하면 보존하려던 행이 사라질 수 있습니다.',concepts:['sql-select','sql-null'],question:'S04.0'},
      {title:'그룹과 집계를 계산합니다',text:'GROUP BY별로 묶은 다음 COUNT·SUM 등을 계산하고 HAVING으로 그룹을 거릅니다. COUNT(*)와 COUNT(열), NULL과 숫자 0을 구분합니다.',concepts:['sql-group','sql-null'],question:'S02.0'},
      {title:'결과 열과 순서를 확인합니다',text:'요구한 열만 출력하고 ORDER BY에 맞춰 정렬합니다. 윈도 함수는 집계 GROUP BY처럼 행을 하나로 합치지 않습니다. SQL 작성 문제에서는 제시된 DBMS와 문장 형태도 확인하세요.',concepts:['sql-window','sql-select'],question:'S11.0'},
    ],
  },
  {
    id:'systems',title:'운영체제·네트워크: 조건을 표로 바꾸기',goal:'계산에 앞서 시간축, 준비 큐, 프레임, 주소 범위 중 필요한 표를 고릅니다.',
    example:'N09.0',practice:'N09.1',reference:'os',
    selfCheck:'도착 시각 2, CPU 실행시간 5인 작업이 시각 10에 끝났고 중간 I/O가 없다면 반환시간과 대기시간은 얼마인가요?',
    explanation:'반환시간은 완료 − 도착 = 10 − 2 = 8입니다. 대기시간은 반환시간에서 실제 CPU 실행시간을 뺀 8 − 5 = 3입니다. 완료 시각 10 자체가 반환시간은 아닙니다.',
    steps:[
      {title:'문제의 가정을 먼저 표시합니다',text:'도착 시각, 선점 여부, 동점 우선순위, 시간 할당량을 적습니다. 라운드 로빈은 같은 시각의 신규 도착과 실행하던 작업의 재삽입 순서도 결과에 영향을 줍니다.',concepts:['scheduling','rr-scheduling','srtf'],question:'N10.0'},
      {title:'변화가 생기는 시점마다 계산합니다',text:'새 작업이 도착하거나 현재 작업이 끝날 때 준비 큐와 남은 실행시간을 갱신합니다. SRTF는 도착한 작업들 중 남은 시간이 가장 짧은 작업을 선택합니다.',concepts:['srtf','process'],question:'N09.0'},
      {title:'상태와 누적 횟수를 분리합니다',text:'페이지 문제는 프레임 내용과 부재 횟수를 따로 적습니다. FIFO의 들어온 순서와 LRU의 최근 사용 순서는 다릅니다. 적중해도 LRU의 사용 순서는 갱신됩니다.',concepts:['paging','replacement'],question:'N05.0'},
      {title:'주소 계산은 비트 경계로 검산합니다',text:'프리픽스로 네트워크와 호스트 부분을 나눕니다. 일반 IPv4 서브넷의 호스트 수 문제에서는 네트워크·브로드캐스트 제외 조건을 확인하고, 라우팅은 일치하는 경로 중 가장 긴 프리픽스를 고릅니다.',concepts:['subnet','routing'],question:'N12.0'},
    ],
  },
  {
    id:'quality',title:'설계·테스트: 요구를 검증 가능한 조건으로 바꾸기',goal:'용어를 맞히는 데서 더 나아가 누락된 조건과 필요한 증거를 설명합니다.',
    example:'X01.0',practice:'X01.1',reference:'forms',
    selfCheck:'로그인 실패를 빨간색 테두리로만 알리고 입력한 내용도 모두 지웠다면, 사용자가 다음 행동을 할 수 있도록 무엇을 보완해야 할까요?',
    explanation:'색 외에 오류 원인을 텍스트로 연결하고, 수정할 입력 위치를 찾을 수 있게 합니다. 보존해도 되는 입력은 유지하며 다시 제출하는 방법을 제공합니다. 비밀번호처럼 보존하면 안 되는 정보는 별도로 판단합니다.',
    steps:[
      {title:'요구와 확인 방법을 연결합니다',text:'요구사항마다 설계·구현·테스트를 연결합니다. 테스트가 있다는 사실만 보지 말고, 해당 요구의 성공 조건을 실제로 검사하는지 확인합니다.',concepts:['traceability','requirements-validation'],question:'X01.0'},
      {title:'관계와 책임을 구분합니다',text:'UML 관계는 화살표 방향과 포함·확장 조건을 함께 읽습니다. 모듈은 한 책임에 집중하는지, 다른 모듈의 내부 내용이나 제어 방식까지 알아야 하는지 살펴봅니다.',concepts:['uml-relations','cohesion-types','coupling-types'],question:'X07.0'},
      {title:'테스트가 빠뜨린 경우를 찾습니다',text:'경계값은 경계 안·밖을 함께 확인합니다. 결정 커버리지는 전체 결정의 참·거짓을, MC/DC는 다른 조건을 고정했을 때 한 조건이 결과를 바꾸는 쌍을 확인합니다.',concepts:['boundary','coverage','mcdc'],question:'X09.0'},
      {title:'실패 뒤의 상태까지 설계합니다',text:'빈 결과·오류·재시도 화면과 입력 보존을 확인합니다. 배포는 프로그램 버전뿐 아니라 데이터 호환성과 복구 순서까지 점검해야 합니다.',concepts:['ui-accessibility','compatibility','rollback'],question:'X14.0'},
    ],
  },
  {
    id:'security',title:'보안·연계: 입력과 권한의 경계 찾기',goal:'공격 이름뿐 아니라 어디서 신뢰가 바뀌고 어떤 방어가 필요한지 판단합니다.',
    example:'X11.0',practice:'X11.1',reference:'binding',
    selfCheck:'사용자가 선택한 정렬 열 이름도 일반 값처럼 SQL 매개변수 하나로 바인딩하면 충분할까요?',
    explanation:'일반적인 매개변수는 값에 사용합니다. 열 이름·정렬 방향 같은 SQL 구조는 허용한 선택지를 서버의 고정 문장에 대응시킵니다. 값 바인딩과 구조의 허용 목록 검증은 역할이 다릅니다.',
    steps:[
      {title:'인증과 인가를 나눕니다',text:'누구인지 확인하는 것과 이 작업을 해도 되는지 확인하는 것은 다릅니다. 로그인한 사용자라도 다른 사람의 기록을 조회·수정할 권한이 자동으로 생기지는 않습니다.',concepts:['authentication','authorization'],question:'X12.0'},
      {title:'입력이 코드로 해석되는 지점을 찾습니다',text:'SQL 문자열 연결과 값 바인딩을 구분합니다. 외부 입력이 파일 경로나 서버 요청 주소를 정한다면 경로 탐색·SSRF의 경계도 살펴봅니다.',concepts:['secure-binding','path-traversal','ssrf'],question:'X11.0'},
      {title:'보호 목적에 맞는 도구를 고릅니다',text:'기밀성, 무결성, 발신자 확인, 비밀번호 검증은 서로 다른 목적입니다. 해시만 붙였다고 발신자가 인증되지는 않으며 비밀번호는 적절한 비밀번호 해싱 함수를 사용합니다.',concepts:['hashing','hmac','password-kdf'],question:'X13.0'},
      {title:'실패와 재시도에서 중복을 확인합니다',text:'서버 처리는 성공했는데 응답만 유실될 수 있습니다. 재요청 식별값과 처리 결과를 연결해 중복 실행을 막고, 입력의 자료형·범위·필수값은 계약에 따라 검사합니다.',concepts:['idempotence','interface-contract'],question:'X05.0'},
    ],
  },
].map(guide=>Object.freeze({...guide,steps:Object.freeze(guide.steps.map(step=>Object.freeze({...step,concepts:Object.freeze(step.concepts)})))})));

export const getStudyGuide=id=>studyGuides.find(guide=>guide.id===id)??null;
