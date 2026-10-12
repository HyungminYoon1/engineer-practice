# Content coverage and sources — 2026-10-12

## Official exam source

[Q-Net 정보처리기사](https://www.q-net.or.kr/crf005.do?id=crf00503s02&jmCd=1320&jmInfoDivCcd=B0) and [2026 criteria viewer](https://www.q-net.or.kr/pageLink.do?link=cst/cstReport&jmCd=1320&mcrtrNo=991).

The 24-page original PDF was downloaded from the official viewer's PDF export. All 24 pages were inventoried; practical pages 11–24 were fully text-read and page 11 visually rendered. Written-theory pages 1–10 were not a substantive review target. Page 11 specifies written-practical (필답형), 150 minutes, validity 2026-01-01 to 2026-12-31. The exam overview states pass at 60/100. Twenty items, five points per item and the app's domain quotas are practice design, not a promise about an official exam paper.

## Coverage map

| 2026 practical heading | Original learning content | Limits |
| --- | --- | --- |
| 요구사항 확인 | 요구 검증·추적표 누락·UML 관계/include/extend | Longer combined models and system-analysis documents need more practice |
| 데이터 입출력 구현 | 키·함수 종속·정규형·E-R 다대다·무손실 판정 | Multiple candidate keys, complex decompositions and physical designs are not exhaustive |
| 통합 구현 | 계약·JSON·응답 유실·멱등 재시도 사례 | Not a deployed integration or all async recovery patterns |
| 서버 프로그램 구현 | 응집/결합 사례·배치·다형성 코드 | Longer business/batch programs and multiple-pattern design need more practice |
| 인터페이스 구현 | 필드 자료형/범위·계약·오류·재시도 | Not all monitoring and tool-based validation cases |
| 화면 설계 | label 연결·빈 결과·실패 복구·색 외 안내·키보드 | Not all UI standards or multi-screen flow exercises |
| 애플리케이션 테스트 관리 | 최소 결정 집합·MC/DC·병목·경계·회귀 | Not all paths/conditions, defect management or official grading |
| SQL 응용 | SQLite 13유형·SQL 직접 작성·PostgreSQL DCL·MySQL 프로시저/함수 빈칸 | Dialects named; not arbitrary-query grading or every routine/optimization pattern |
| 소프트웨어 개발 보안 구축 | 바인딩 수정·SSRF/경로 탐색/XXE/CSRF/DoS·암호 도구 목적 | Not all attack/crypto algorithms or long vulnerable programs |
| 프로그래밍 언어 활용 | C·Java·Python 23유형·이진 탐색·연결 리스트·다형성·중첩 복사 | Not every library/data structure or long combined program |
| 응용 SW 기초 기술 활용 | SRTF/RR 도착·은행원 안전·최장 프리픽스·페이지·서브넷 | Multi-resource synchronization and routing protocol/configuration cases are not exhaustive |
| 제품 SW 패키징 | 기준선·승인·설치/릴리즈 누락·호환/복구 | Not all tool-based packaging or complete deployment specifications |

All twelve headings have related concepts and directly reachable applied exercises after the re-audit. This is **not** complete coverage of every detailed performance criterion or evidence of a pass. Actual count: 134 concepts, 70 applied families, 583 bounded items. Questions/explanations are authored here; no recovered exam paper, textbook scan or commercial answer key is included. Primary references are linked in curriculum/casebook; large documents are used selectively, not claimed fully reviewed.

## Verification boundaries

- All 184 C/Java/Python variants and 95 SQLite variants: native execution comparison before publishing. C11 avoids unsequenced mutation, pointer bounds and signed overflow. Java compiles with `--release 17`. SQLite fixtures are frozen and ordering is explicit where relevant. Written-SQL canonical statements are executed but submitted user input is not.
- PostgreSQL DCL 5 and MySQL routine cases 10: author-completed statements/definitions executed offline in disposable, network-isolated containers; check permission effects and calls/return values. Official syntax/function/parameter documentation was also compared. A theoretical dialect label is not used to waive the execution gate.
- Seventy-five calculation items across fifteen families: original reference calculations. Hand-drawn SRTF/RR totals and fixed normal-form/coverage/permissions references have independent tests; not every trace is compiler-instrumented or every conceivable input tested.
- 134 term prompts: explicit accepted aliases, content/prerequisite integrity and grading tests; not an official examiner's full list of permitted answers.
- Traces: authored educational state steps and code-line checks, not compiler-instrumented complete memory traces.
- `2027–2029`: official criteria listing exists; detailed alignment is NOT_INSPECTED. Do not silently select that profile or claim next-year completeness.

## Technical sources selected in this re-audit

Q-Net practical PDF pages 11–24; SQLite window/trigger/transaction/CTE specifications; authors' Database System Concepts chapter 7 selected FD/3NF/BCNF sections; UC Berkeley CS186 normalization notes; MySQL 8.4 CREATE PROCEDURE/FUNCTION parameter/RETURNS/RETURN grammar; PostgreSQL GRANT/REVOKE syntax/privilege propagation; OWASP injection/SSRF/XXE/password/CSRF guidance; W3C form labeling; GNU mode bits; IETF ARP/CIDR. Selective technical-source review, not complete review of each linked manual. Own examples/conditions, not copied source examples.

## Named-source inventory for the current re-audit

engineer-practice: VERIFIED authoritative architecture/requirements/README, decisions/sources/verification and directly related core modules, added casebook/coverage, regression/content/storage/native test paths. WEB LAB: VERIFIED inventory, architecture/README/current decisions, selected catalog entry and tests/checks; PARTIAL repository overall (other apps' feature code is not re-audited). Official PDF: VERIFIED practical pages 11–24 and rendered page 11, PARTIAL whole document. 2027–2029 criteria: NOT_INSPECTED in detail. SENSE LAB/private course files/other services/Neon/user browser records: NOT_INSPECTED and unchanged this turn. Initial delivery's broader source inventory is historical, not current full audit evidence.
