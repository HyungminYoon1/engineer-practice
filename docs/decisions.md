# Decision log

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
