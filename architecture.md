# Architecture — 정보처리기사 실기 학습실

## Scope

Independent public static GitHub Pages application at `/engineer-practice/`. Korean Information Processing Engineer written-practical preparation: concept paths, typed answers, trace review, spaced review, local history, a 20-item diagnostic and 150-minute mock sessions. Browser-only HTML/CSS/ES modules, no runtime npm dependencies, account, backend, external runtime API, analytics, AI API or public ranking. Existing repositories are not merged or migrated. Neon is not required for this scope; provider/account changes are deferred unless a server-side requirement is approved.

## Layers

- `dist/src/curriculum.js`: immutable original concept explanations, prerequisites, comparisons and primary reference metadata.
- `dist/src/questions.js`: deterministic original item-family builders. Fixed bounded variant codes, expected answers, pedagogy and traces. No DOM, storage, clock or execution of user code.
- `dist/src/engine.js`: pure answer normalization by rubric, balanced diagnostic/mock selection, review scheduling and mastery summaries. No DOM or storage.
- `dist/src/store.js`: single injected storage boundary, strict versioned parsing, finite record limits, merge/readback, export/import validation and explicit deletion. Never read/write other apps' keys.
- `dist/src/view.js`: safe DOM construction, question/concept/trace rendering. Text is assigned with `textContent`; no untrusted HTML interpolation.
- `dist/src/app.js`: routing, form/input/timer lifecycle, bounded session orchestration, persistence status and accessible focus.
- `dist/index.html`, `styles.css`: semantic responsive shell and print layout. Relative assets support Pages subpaths.
- `tools/verify-native.mjs`: offline native C/Java/Python/SQLite verification of all bounded code/SQL variants, no submitted user code. Generated temporary programs are confined to a validated dedicated OS temporary directory; only that owned directory may be cleaned after verification. Runtime execution is required, syntax-only results do not count. Code uses defined C11 behavior, Java 17-compatible language and Python 3 integer/list semantics. SQLite questions state the engine explicitly.
- `tools/serve.mjs`, `check.mjs`: loopback-only dist preview and static integrity/provenance checks.
- `test/`: deterministic content/answer/scheduling/storage/session tests.
- `.github/workflows/pages.yml`: checks and native verification before uploading only dist. Exact official action pins, deployment-scoped Pages permissions.

## Content and exam versions

Public content is original, not copied recovered papers/textbook diagrams/explanations. Primary technical documentation and Q-Net are linked by topic. `2026` is the initial preparation profile; official exam facts are 150 minutes and pass at 60/100. Twenty-item mock/diagnostic and domain distribution are app policies, not official guarantees or future exam predictions. 2027–2029 criteria are listed by Q-Net but detailed alignment is not claimed until the new original criteria have been fully compared. The UI makes the preparation profile and original-question status visible without treating reconstructed/publisher material as official answer keys.

## State and privacy

Only key `engineer-practice-v1` is used. Version 1 JSON contains settings, at most 2048 bounded attempts, up to 128 bookmarked question codes, concept review state derived from attempts, at most 20 completed session summaries, and at most one resumable session of 20 fixed verified question codes and bounded draft answers. Maximum serialized input/output is 1,048,576 characters. No name, email, raw keyboard events, random seeds, clinical/aptitude inference, third-party records, network sync or visitor profile. No time-based expiry; appending beyond a cap evicts the oldest relevant record. Clear-data deletes only this key after explicit confirmation. Backup is a deliberate local JSON download; restore validates before replacing only this application's records, confirms replacement and preserves corrupt/unknown current records unless the user explicitly restores/clears. Storage denial, quota and readback errors are visible; app remains usable in memory without claiming records were saved. Cross-tab fresh reads/storage-event refresh reduce races; localStorage is not an atomic multi-tab transaction and no synchronization guarantee is claimed.

Same-origin GitHub project Pages scripts can access browser storage; project path is not an access-control boundary. Gallery integration is metadata and static captures only. This application does not add a new entry to the legacy shared completion key or read existing private sensory/game data.

## Grading and progress

Terms use explicit accepted aliases; code outputs preserve case and significant spacing/newlines according to the per-item rubric. Numeric items accept a fully parsed finite integer in the required unit, not partial `parseInt` matches. No fuzzy substring acceptance, AI final grader or official partial-credit claim. Traces are educational state views, not physical memory addresses or unrestricted language interpreters. SQL output uses a stated frozen dataset; arbitrary query equivalence is not claimed. A second unhinted correct attempt on a different variant after a delay is required for the strongest mastery state. Mock feedback is withheld until submission or timeout; drafts are automatically kept in the one local session. Pausing/navigation does not extend the absolute wall-clock deadline; diagnostics have no deadline. Review intervals are an app heuristic, not a universal scientifically optimal schedule or a pass-probability prediction.

## Delivery

UTF-8 without BOM / CRLF for tracked text; no secret files or private documents. Test artifacts stay outside public dist. Publish after owner approval, verify origin before each normal fast-forward push, keep remote CI and public HTTP/hash/browser checks distinct. No Sites hosting migration or provider provisioning.
