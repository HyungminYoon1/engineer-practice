# Decision log

## D10 — Concept-first guided paths and verified examples (2026-10-13)

- Context: the owner requests learning-content improvements as part of automated maintenance. A large finite catalog alone does not explain how to approach a new problem.
- Options: inflate item counts with more fixed numbers; external AI tutoring; original reasoning guides connected to the existing verified bank.
- Decision: add six paths and 24 steps covering value/reference tracing, dependencies/normalization, SQL intermediate rows, scheduling/network calculations, requirements/testing and security/integration. Each includes an explanation check, an existing worked example and a different-condition practice link. Counts remain 134 concepts/583 items/70 applied families. Viewing guidance does not create performance records. The active-exam guard also covers the new route.
- Rationale: explain how to reason and verify, preserve existing answers/IDs/backup schema, and avoid claiming a pass prediction or adding runtime services.
- Affected: study-guides.js, app/view/index/styles, content-link integrity test, README/requirements/architecture/source notes and gallery metadata/capture.
- Review: all six paths/examples and typed practice, trace next/previous highlighting, active mock answer isolation, 320px/desktop layout. Primary source sections are selected, not entire manuals; existing bank native verification remains required before release.

## D09 — Readable backup round-trip at the storage limit (2026-10-13)

- Context: automated maintenance is approved. A valid near-capacity record is exported with indentation, then rejected by the old restore parser because formatting pushes the file over the storage limit.
- Options: remove readable formatting from future exports only; increase retained data capacity; accept bounded formatting and validate the canonical record before replacement.
- Decision: keep version 1, readable export, all record caps and the 1,048,576-character compact storage cap. Restore accepts at most 4,194,304 input characters (the browser also limits the file to that many bytes), then requires the validated compact JSON to fit the original storage cap. Oversized actual data is rejected before replacement; import never silently trims a backup.
- Rationale: existing readable backups remain recoverable without increasing retained data or changing the storage schema. Input is bounded before parsing and schema/grade validation remains mandatory.
- Affected: store.js, app.js, store regression tests and storage documentation.
- Review: red-first reproduction with near-capacity Korean answers, bookmarks and an active draft; full state equality after restore; excessive formatting and genuinely oversized records preserve existing storage and unrelated keys.

## D08 — 미수록 주제의 응용 문제화와 DBMS 실행 검증 (2026-10-12)

- Context: 사용자가 미수록 안내에 머물지 말고 실제 답안 연습을 추가하도록 요구하고 서술형 여부를 질문했습니다. 대상은 2026입니다.
- Options: 빠진 주제를 교재로만 넘김; 임의 AI 장문 채점/서비스 DB; 원본의 유한한 작성·빈칸·사례 문항과 오프라인 실행 검증.
- Decision: 22개 개념과 30개 응용 유형을 추가합니다. 최종 134개 개념·70개 응용 유형·583문항이며 영역 12개에 직접 문제 링크를 연결합니다. SQL 토큰 채점은 외부 공백·키워드 대소문자·한 번의 마지막 세미콜론만 허용하고 문자열 내용/토큰 경계를 보존합니다. 지정한 형태와 등록한 별칭만 허용하며 사용자 SQL을 실행하거나 모든 동치 질의를 판정하지 않습니다.
- Rationale: 단답 암기 외에 요구 추적·UML 관계·분해·연계 오류·화면 복구·MC/DC·보안 수정·암호 목적·형상/설치 판단·도착이 다른 스케줄링 등을 직접 풀게 합니다. 공식 필답형은 전체 항목을 장문 서술형으로 낸다는 보장이 아니며 회차별 형식/비중을 예측하지 않습니다.
- Validation policy: C/Java/Python/SQLite 279개 변형은 기존 네이티브 도구로 실행합니다. PostgreSQL DCL 5·MySQL 프로시저 5·함수 5개는 명시된 DBMS의 원본 정답으로 완성해 임시 Docker에서 실행·권한/반환값을 확인합니다. 빈칸·DCL은 사례 형식으로 분류하지만 실행 검증을 생략하지 않습니다. CI에도 별도 방언 검증을 추가합니다.
- Storage/security: 브라우저 정적 구조·기존 v1 키/ID/정답·무계정/무서버 정책을 유지합니다. 테스트 컨테이너만 네트워크 none·공개 포트/호스트 마운트 없음·512MB/2CPU·고유 소유 라벨로 생성하고 종료 전 라벨/이름/마운트를 확인합니다. 시험 역할은 필요한 권한만 받으며 Neon·기존 컨테이너·사용자 DB는 건드리지 않습니다. 테스트 이미지 캐시는 남을 수 있습니다.
- Affected: casebook/curriculum/questions/coverage/engine/view/app, scope-expansion tests, verify-dialects/package/workflow, 권위·출처·QA·검증 문서, 해당 갤러리 항목/실제 캡처.
- Review: 31개 Node 검사·70개 실제 브라우저 응용 입력·12개 영역 링크·문자열 보존/오채점·320px를 확인합니다. 실제 사람의 합격 가능성·전체 기출·공식 부분점수·모든 상세 수행 기준의 완전성은 주장하지 않습니다. 초기 임시 DB가 ping에 응답한 뒤 재시작하는 경합을 재현해 최종 서버 프로세스 준비 확인으로 수정했습니다.

## D07 — Exam adequacy and red-first audit corrections (2026-10-12)

- Context: owner asks whether 88 concepts / 304 variants cover the 2026 exam and requests test-first fixes. Original counts and broad heading coverage are not complete performance-criterion coverage or evidence of a pass.
- Options: claim readiness from totals; enlarge numbers with repeated variants; source-aligned gap reporting, bounded original application problems and reproduce real logic/UX defects before patching.
- Decision: preserve static layers, local version-1 key, original question IDs/answers and 2026 profile. Add explicit twelve-heading coverage/gaps and better family access. Reset delayed mastery evidence after errors/hints, mix concept/applied diagnosis, reject edits at the absolute deadline, preserve newer sessions on duplicate stale completion. Retain count limits and trim oldest attempts (then completed summaries if necessary) to the existing serialized limit; never evict active drafts/settings for capacity.
- Rationale: reproducible correctness and transparent limits, not a claim that completing the bank predicts official pass. Red tests recorded before fixes; additive content must execute natively and old backups remain valid.
- Affected: engine/store/app/view/curriculum/questions, test/audit-regression.test.js, coverage module, UI/CSS, README/requirements/source/QA/verification docs and only this app's gallery entry/capture.
- Review: preserve corrupt/unknown versions; localStorage still has non-atomic multi-tab races. Hardening repeated stale completion does not promise full transaction isolation. No DB, API, provider or ranking changes. 2027 criteria remain outside this 2026 request. Existing approval supports publishing after validation; record local and live separately.

## D05 — Explicit public app name (2026-10-12)

- Context: owner says “실기 연습실” does not identify the subject.
- Options: keep the generic name with a small subtitle; use an unambiguous Korean name across visible surfaces.
- Decision: “정보처리기사 실기 학습실” in browser title, logo accessible label, footer, print documents, README and WEB LAB introduction. Repository slug remains engineer-practice; no storage migration or provider change.
- Rationale: visitors can identify qualification and purpose without opening a description.
- Affected: index.html, app.js, architecture, README, gallery metadata/captures.
- Review: title and name consistency, small-screen wordmark fit, print headers and gallery search.

## D01 — Static learning app and independent delivery (2026-10-12)

- Context: owner approves implementing the reviewed practical-exam learning plan, using Neon only if needed, and publishing after validation. Existing services are independent GitHub Pages applications.
- Options: mandatory hosted account/DB/AI grader; merge into a generic problem bank; independent static original-content app.
- Decision: independent engineer-practice repository, native browser modules, bounded local records, no DB/account/AI calls; WEB LAB only links metadata and a real capture. Deploy only dist with test/native-verification gate and public noreply Git identity.
- Rationale: requested concept/problem/review/mock features work locally, avoid server cost/secrets and unnecessary learning-data collection. Neon is reserved for a separately requested cross-device/server need.
- Affected: architecture, requirements, package, dist, tools, tests, workflow, README and gallery metadata.
- Review: native execution, browser flows, storage failure/backup, responsive/print, origin and remote CI/live hashes; no claims of full hardware/browser coverage or official certification.

## D02 — Original finite question families and preparation profiles

- Context: public textbook/recovered exam access is not a redistribution license; 2027–2029 criteria are newly listed but detailed mapping was not established in the initial research.
- Options: scrape and republish exams; unconstrained AI generation; reviewed original families with bounded deterministic variants and sources.
- Decision: original concept/term/code/SQL/numeric families with explicit provenance, known codes and tested variants. Count concepts/families/variants separately. Initial profile is 2026 preparation; do not expose an unverified 2027-aligned filter or promise predicted question weights. Twenty-item mocks use a declared app allocation. Native stdout verification is mandatory for every code/SQL variant, not only reference examples. C avoids UB, Python/Java semantics are executed, SQL uses SQLite with stated fixtures.
- Rationale: correctness, reproducibility and honest exam scope outweigh large unverified question counts. AI authoring is followed by actual language/DB verification, not AI consensus grading.
- Affected: curriculum.js, questions.js, engine.js, verify-native.mjs, content tests, README/source notes.
- Review: independently compare future official criteria, manually inspect multi-domain explanations, track corrected content versions, do not treat app scoring as the authority's undisclosed rubric.

## D03 — Device-local bounded retention and safe restore

- Context: adaptive review needs past outcomes but no shared account or public ranking was requested.
- Options: memory-only review; remote personal profiles; one strict versioned local key and deliberate backups.
- Decision: own key only, maximum 2048 attempts/128 bookmarks/20 session summaries/one 20-item resumable session and 1Mi characters. Minimal answer/hint/confidence/time/error-cause records; no identity/raw keys. Oldest entries evicted on cap, no age expiry. Fresh-read merge and verified writes; invalid/unknown state preserved until explicit confirmed restore/clear. Never clear browser storage. Export/import bounded validated JSON; notify same-origin and no cross-device sync. Storage failure is visible and learning can continue ephemerally.
- Rationale: useful private learning continuity without provider setup, surprise data collection or damage to other services. Browser same-origin access and multi-tab races are disclosed.
- Affected: store.js, engine.js, app.js, storage tests, settings/privacy UI and README.
- Review: denial, quota, corrupt/version/oversized/prototype payload, backup round-trip, cancelled confirmations, deleted-data non-resurrection and other-key preservation.

## D04 — Answer-first learning, delayed mastery and absolute mock deadline

- Context: the practical assessment requires written answers; repeated answer recognition is not generalizable skill.
- Options: multiple-choice only, instant solution during mocks, speed-based public ranks; typed answers with scaffolding only in learning mode.
- Decision: answer-first practice, deliberate hint flagged on attempts, confidence/error-cause, trace only after grade, variant retest and delayed unhinted mastery. Balanced diagnostic and mock: no hint/answers until final submission, 150-minute absolute deadline survives reload and navigation, one durable terminal summary, unanswered items reviewed. Term aliases and per-item output formats are explicit; no fuzzy AI grade or clinical/official pass-probability claim.
- Rationale: retrieval and feedback support learning; mode separation preserves useful practice under real timing without pretending to replicate official scoring details.
- Affected: engine.js, app.js, view.js, tests, print CSS, QA inventory.
- Review: IME/duplicate inputs, mock early navigation/resume/timeout/unanswered review, boundary time/clock changes and restored drafts. Local clock is not tamper-proof and public ranking is intentionally absent.
# D06 — Public delivery identity and verification (2026-10-12)

- Context: owner approved public GitHub/Pages delivery after validation; no private email or exam history should be published.
- Options: inherit global Git identity; public GitHub account identity scoped to these repositories.
- Decision: use verified HyungminYoon1 account with its public numeric-id GitHub noreply address in repository-local Git config. Publish only repository source/docs and dist, not PDF source downloads, synthetic backups, native temporary programs or browser session state. No Neon changes.
- Rationale: approved public artifacts remain separate from private environment and test evidence.
- Affected: local Git configuration, .gitignore, .github/workflows/pages.yml, docs/verification.md.
- Review: normal push only after origin checks; record remote CI, deployed source revision and public HTTP/hash/browser validation separately. Unrelated service files/preview images must remain unchanged.
