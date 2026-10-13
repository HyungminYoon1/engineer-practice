# Architecture — 정보처리기사 실기 학습실

## Scope

Independent public static GitHub Pages application at `/engineer-practice/`. Korean Information Processing Engineer written-practical preparation: concept paths, typed answers, trace review, spaced review, local history, a 20-item diagnostic and 150-minute mock sessions. Browser-only HTML/CSS/ES modules, no runtime npm dependencies, account, backend, external runtime API, analytics, AI API or public ranking. Existing repositories are not merged or migrated. Neon is not required for this scope; provider/account changes are deferred unless a server-side requirement is approved.

## Layers

- `dist/src/curriculum.js`: immutable original concept explanations, prerequisites, comparisons and primary reference metadata.
- `dist/src/casebook.js`: pure additive original scenario, written-SQL, code and scheduling builders and their concept/reference rows. No side effects or imports of UI/state.
- `dist/src/coverage.js`: twelve-heading concept/family guide and derived inventory. Topic presence is not a detailed-criterion percentage or a pass probability.
- `dist/src/study-guides.js`: six original guided learning paths with four reasoning steps each, linked concepts, verified-bank examples and a different practice condition. Pure content; no additional storage or score.
- `dist/src/questions.js`: deterministic original item-family builders. Fixed bounded variant codes, expected answers, pedagogy and traces. No DOM, storage, clock or execution of user code.
- `dist/src/engine.js`: pure answer normalization by rubric, balanced diagnostic/mock selection, review scheduling and mastery summaries. No DOM or storage.
- `dist/src/store.js`: single injected storage boundary, strict versioned parsing, finite record limits, merge/readback, export/import validation and explicit deletion. Never read/write other apps' keys.
- `dist/src/view.js`: safe DOM construction, question/concept/trace rendering. Text is assigned with `textContent`; no untrusted HTML interpolation.
- `dist/src/app.js`: routing, form/input/timer lifecycle, bounded session orchestration, persistence status and accessible focus.
- `dist/index.html`, `styles.css`: semantic responsive shell and print layout. Relative assets support Pages subpaths.
- `tools/verify-native.mjs`: offline native C/Java/Python/SQLite verification of all bounded code/SQL variants, no submitted user code. Generated temporary programs are confined to a validated dedicated OS temporary directory; only that owned directory may be cleaned after verification. Runtime execution is required, syntax-only results do not count. Code uses defined C11 behavior, Java 17-compatible language and Python 3 integer/list semantics. SQLite questions state the engine explicitly.
- `tools/verify-dialects.mjs`: offline author-completed PostgreSQL DCL and MySQL routine cases. Disposable labelled containers, no network, exposed ports or host mounts; fixture role has only specific tested privileges. Readiness waits for the final server, not its temporary initialization server. Cleanup verifies ownership first. This is test infrastructure, not a runtime DB/server or execution of user input.
- `tools/serve.mjs`, `check.mjs`: loopback-only dist preview and static integrity/provenance checks.
- `test/`: deterministic content/answer/scheduling/storage/session tests.
- `.github/workflows/pages.yml`: checks and native verification before uploading only dist. Exact official action pins, deployment-scoped Pages permissions.

## Content and exam versions

Public content is original, not copied recovered papers/textbook diagrams/explanations. Primary technical documentation and Q-Net are linked by topic. `2026` is the initial preparation profile; official exam facts are 150 minutes and pass at 60/100. Twenty-item mock/diagnostic and domain distribution are app policies, not official guarantees or future exam predictions. 2027–2029 criteria are listed by Q-Net but detailed alignment is not claimed until the new original criteria have been fully compared. The UI makes the preparation profile and original-question status visible without treating reconstructed/publisher material as official answer keys.

## State and privacy

Only key `engineer-practice-v1` is used. Version 1 JSON contains settings, at most 2048 bounded attempts, up to 128 bookmarked question codes, concept review state derived from attempts, at most 20 completed session summaries, and at most one resumable session of 20 fixed verified question codes and bounded draft answers. Compact serialized storage is limited to 1,048,576 characters. Readable backup formatting may exceed that length: import accepts at most 4,194,304 characters and the browser limits file input to 4,194,304 bytes, then validates that compact serialized data fits the unchanged storage cap. Oversized actual data is rejected without replacement or silent trimming. No name, email, raw keyboard events, random seeds, clinical/aptitude inference, third-party records, network sync or visitor profile. No time-based expiry; appending beyond count limits evicts oldest relevant records. Serialized capacity additionally trims oldest attempts, then completed summaries if needed, never the active draft/settings/bookmarks. Clear-data deletes only this key after explicit confirmation. Backup is a deliberate local JSON download; restore validates before replacing only this application's records, confirms replacement and preserves corrupt/unknown current records unless the user explicitly restores/clears. Storage denial, quota and readback errors are visible; app remains usable in memory without claiming records were saved. Cross-tab fresh reads/storage-event refresh reduce races; localStorage is not an atomic multi-tab transaction and no synchronization guarantee is claimed.

Same-origin GitHub project Pages scripts can access browser storage; project path is not an access-control boundary. Gallery integration is metadata and static captures only. This application does not add a new entry to the legacy shared completion key or read existing private sensory/game data.

## Grading and progress

Terms use explicit accepted aliases; code outputs preserve case and significant spacing/newlines according to the per-item rubric. Numeric items accept a fully parsed finite integer in the required unit, not partial `parseInt` matches. Written SQL uses a bounded lexical-token rubric: ignore whitespace/unquoted keyword case/one terminal semicolon, preserve quoted literal/identifier content and token boundaries, accept only declared canonical shapes/aliases. It does not execute submitted SQL or claim arbitrary semantic equivalence. No fuzzy substring acceptance, AI final grader or official partial-credit claim. Traces are educational state views, not physical memory addresses or unrestricted language interpreters. SQL output uses a stated frozen dataset. Delayed unhinted correctness and different-condition evidence must belong to the current consecutive correct streak, reset by error/hint. Mock feedback is withheld until submission or timeout; drafts are automatically kept in the one local session. Each input/navigation operation checks the absolute deadline, including before a delayed timer tick. Pausing/navigation does not extend it; diagnostics have no deadline. Stale repeated completion cannot discard a newer session. Starting a new session clears the previous print sheet, and printing during an active session generates only its questions. Review intervals and daily 15/30/60-minute allocations are app suggestions, not a universal optimal schedule or a pass-probability prediction.

Historical version1 SQL outcomes may have been recorded under compatibility normalization. To keep existing backups readable, import validates against either that former rule or the corrected rule, without rewriting stored answers or outcomes. New SQL token answers preserve quoted code points. When current review differs from an old exam score, the UI labels both scores explicitly. Stale completion of an abandoned/deleted exam is a no-op, not a new stored result. This is compatibility within version1, not a new storage schema or an arbitrary-answer acceptance rule.

## Delivery

UTF-8 without BOM / CRLF for tracked text; no secret files or private documents. Test artifacts stay outside public dist. Publish after owner approval, verify origin before each normal fast-forward push, keep remote CI and public HTTP/hash/browser checks distinct. No Sites hosting migration or provider provisioning.
