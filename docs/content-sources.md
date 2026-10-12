# Content coverage and sources — 2026-10-12

## Official exam source

[Q-Net 정보처리기사](https://www.q-net.or.kr/crf005.do?id=crf00503s02&jmCd=1320&jmInfoDivCcd=B0) and [2026 criteria viewer](https://www.q-net.or.kr/pageLink.do?link=cst/cstReport&jmCd=1320&mcrtrNo=991).

The 24-page original PDF was downloaded from the official viewer's PDF export. All 24 pages were inventoried; practical pages 11–24 were fully text-read and page 11 visually rendered. Written-theory pages 1–10 were not a substantive review target. Page 11 specifies written-practical (필답형), 150 minutes, validity 2026-01-01 to 2026-12-31. The exam overview states pass at 60/100. Twenty items, five points per item and the app's domain quotas are practice design, not a promise about an official exam paper.

## Coverage map

| 2026 practical heading | Original learning content | Limits |
| --- | --- | --- |
| 요구사항 확인 | 요구사항·추적·UML | No complete requirements engineering course |
| 데이터 입출력 구현 | 관계형 모델·키·정규화·트랜잭션·SQL | No DB administration lab |
| 통합 구현 | 미들웨어·계약·JSON·재시도 | Concept prompts, not a deployed integration |
| 서버 프로그램 구현 | 응집도·결합도·배치·언어 코드 | No arbitrary server code execution |
| 인터페이스 구현 | 계약·JSON·통합 테스트·멱등성 | No external endpoint practice |
| 화면 설계 | 프로토타입·화면 설계서·요구사항 | Concept comparisons, not a UI authoring course |
| 애플리케이션 테스트 관리 | 단위·통합·화이트/블랙박스·경계·커버리지·성능·회귀 | No official scoring rubric |
| SQL 응용 | JOIN·집계·NULL·서브쿼리·UNION·DDL/DML/DCL·트리거·윈도 함수 | Six executable SQLite families; procedural SQL covered as concepts only |
| 소프트웨어 개발 보안 구축 | 인증·인가·삽입·XSS·해시·암호·솔트·방화벽 | Selected foundations, not all attacks/algorithms |
| 프로그래밍 언어 활용 | C·Java·Python original output/trace families | 16 bounded families, not all language/library syntax |
| 응용 SW 기초 기술 활용 | 프로세스·메모리·스케줄링·IP·TCP/UDP·DNS·OSI | Selected network/OS calculations |
| 제품 SW 패키징 | 형상·CI·패키징·릴리즈 노트·설치·롤백·DRM | No actual packaging tool installation exercise |

All twelve headings have introductory concept coverage. This is **not** complete coverage of every detailed performance criterion. Questions/explanations are authored in this repository; no recovered exam paper, textbook scan or commercial answer key is included. Primary technical references are linked in `curriculum.js`; those large documents were used selectively, not claimed fully reviewed.

## Verification boundaries

- All 128 C/Java/Python variants and 48 SQL variants: native output comparison before publishing. C11 avoids unsequenced mutation, pointer bounds and signed overflow. Java code compiles with `--release 17`. SQLite fixtures are frozen and ordering is explicit where relevant.
- Forty calculations: fixed independently computed mathematical expectations tested across all five variants.
- Eighty-eight term prompts: explicit accepted aliases, content/prerequisite integrity and grading tests; not an official examiner's full list of permitted answers.
- Traces: authored educational state steps and code-line checks, not compiler-instrumented complete memory traces.
- `2027–2029`: official criteria listing exists; detailed alignment is NOT_INSPECTED. Do not silently select that profile or claim next-year completeness.

## Named-source inventory

SENSE LAB and WEB LAB: repository inventory plus fully read selected architecture/README/decisions/checks and directly related implementation; unrelated tests/app features only PARTIAL review. New application: authored scope files and all core source modules reviewed. Official practical PDF: VERIFIED pages 11–24, PARTIAL document overall. Existing private notes and unrelated repositories: NOT_INSPECTED / outside scope.
