# WEB LAB 계정 확장 검증

## 검사 대상과 경계

- VERIFIED: 지정한 `web-lab/LOCAL_HANDOFF.txt` 전체를 읽었으며 `.git/info/exclude`의 `/LOCAL_HANDOFF.txt` 제외와 비추적 상태를 유지했다.
- PARTIAL: 세 저장소를 목록화하고 관련 architecture/requirements/README, 인증·저장·동기화·UI·DB·검증 코드와 갤러리 메타데이터를 선별 검사했다. 모든 기존 학습 원고나 다른 19개 앱 구현을 전부 다시 읽었다고 주장하지 않는다.
- 기존 정보처리기사 store/문항·채점 파일, 인터넷보안 13개 주차 JSON과 기존 SQL 001–007은 수정하지 않았다. 갤러리의 나머지 19개 메타데이터·미리보기도 보존한다.

## 로컬 검증

| 범위 | 결과 |
| --- | --- |
| 정보처리기사 기존 52 + 계정/DB 14 tests | 66 PASS |
| 인터넷보안 Node/PGlite | 124 PASS |
| WEB LAB Node | 28 PASS |
| 정보처리기사 Chromium adapter UI | 8/8 PASS |
| 인터넷보안 Chromium adapter UI | 9/9 PASS |
| 인터넷보안 기존 브라우저 회귀 | 25/25 PASS |
| 두 계정 화면·갤러리 1440/390/320px | PASS, 실제 화면 확인 및 두 JPG 갱신 |
| 동일 고정 Neon SDK 번들 | 두 앱 SHA-256 일치 |
| C/Java/Python/SQLite 실제 실행 | 279/279 PASS, JDBC 정상 5·대소문자 오류 거부 5 |
| PostgreSQL/MySQL 격리 실행 | 15/15 PASS, 테스트 컨테이너 정리 완료 |

정보처리기사 UI는 비로그인 저장, 명시적 가져오기와 원본 보존, 오프라인 대기·재접속, 시험 답안/포커스/마감 유지, 저장 실패 시 미기록 표시, 충돌 선택, 로그아웃, 가입·인증 오류·복구 양식과 320px를 검사한다. 도메인 테스트는 응답 유실·재로딩·후속 편집, 사용자 전환, 다른 탭/용량 오류, epoch, 초기화 중 편집 차단과 확인 후 발견한 새 원격 기록의 초기화 취소를 포함한다. 마지막 초기화 사례는 먼저 실패를 재현한 뒤 수정하고 통과했다.

SQL 테스트는 실제 migration을 PGlite에 적용하여 이메일 미인증/익명/다른 사용자 거부, private 테이블·helper 권한, 앱 ID, CAS·idempotency·operation 재사용, 타입·필드·문항·날짜·한도, 시험 마감 관계, reset epoch, Auth 삭제 FK를 확인한다. 이는 실제 Neon 검증과 구분한다.

## 실제 운영 Auth/Data API와 후보 UI

기존 허용 Pages origin에서 후보 프런트엔드 바이트를 테스트 브라우저에만 제공했다. 운영 Auth origin 목록을 넓히지 않았다. 실제 Neon에 이번 실행의 임시 example.com 사용자만 생성하고 테스트 후 ID+이메일 조건으로 삭제했다.

- Chromium의 실제 이메일 로그인 → 정보처리기사 풀이 저장 → guest 원본 보존: PASS.
- 같은 관리형 세션으로 인터넷보안 ‘기존 WEB LAB 로그인 연결’, 별도 재가입 없이 동일 UUID 사용: PASS.
- Firefox의 별도 브라우저에서 같은 계정의 정보처리기사 기록 읽기: PASS.
- 실제 JWT의 익명/다른 사용자/expected-user 거부와 앱 namespace: PASS.
- 정보처리기사 초기화 후 인터넷보안 상태 지문·계정·guest 원본 보존: PASS.
- 인터넷보안에서 로그아웃 후 다른 앱 화면에서 계정 상태 해제: PASS.
- WebKit: 비밀번호 교환 이후 관리형 세션 쿠키가 유지되지 않는 기존 제한 재현. 연결 성공으로 표시하지 않고 비로그인/백업 안내. 실제 iOS/Android 기기 검증은 수행하지 않았다.
- 실제 이메일함 수신은 검증하지 않았다. 테스트 전용 사용자의 인증 상태를 제어했으며 실제 사용자 인증 상태는 변경하지 않았다.

## 기존 운영 기록 보존 근거

변경 전 aggregate 지문을 별도의 비공개 output에 기록했다. 기존 Auth 사용자·account 연결·인터넷보안 영수증·원래 migration의 지문은 동일하며 row 수도 유지했다. 전체 progress 행 지문은 읽기 접속의 rate_window/rate_count 활동 뒤 달라졌다. 이 차이를 ‘모든 바이트 동일’이라고 보고하지 않는다. 기존 학습 updated_at은 작업 시작 이전이고 revision은 변경되지 않은 영수증의 acceptedRevision과 일치함을 추가 확인했다. 모든 기존 쓰기 경로는 학습 변경 시 updated_at을 갱신한다.

추가로 rate 메타데이터를 제외한 학습 행 지문을 마이그레이션 이후 checkpoint로 저장하여 공개 배포 전후 비교에 사용한다. 기존 원본 baseline은 교체하지 않는다. 테스트 원본·DB 연결 정보·세션·진단 산출물은 커밋/배포하지 않는다. 자격증명은 저장소 밖 Windows 사용자 암호화 파일에서 프로세스에만 전달하고 작업 완료 시 제거한다.

## 배포 판정

GitHub Actions는 정확한 커밋에서 빌드·Node·정적 검사·브라우저 검사와 기존 native/dialect 정답 검증 후 dist만 배포한다. 로컬 검사, 실제 Neon 후보 검사, Actions 성공과 공개 사이트 바이트/실제 동작 검증은 각각 구분한다. 공개 배포 결과는 해당 커밋의 Actions와 공개 HTTPS 응답을 기준으로 확인한다.
