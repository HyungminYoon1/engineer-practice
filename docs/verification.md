# Verification — 2026-10-12

## Local

- Native language/SQL execution: PASS 176 variants (C 48, Java 40, Python 40, SQLite 48), GCC 15.1.0, Java 25 compiling for release 17, Python 3.11.9. Educational traces are separate authored explanations.
- Node tests: PASS 15. All 304 reference answers, aliases/output/table/numeric rubrics, forty independently calculated references, 100-seed diagnostic/mock quotas, delayed review/transfer, deadline and strict bounded storage.
- Static checker: PASS. Relative public assets, syntax, UTF-8 without BOM, precise name, original provenance, no eval/HTML injection/runtime network or broad storage deletion.
- Real isolated Chrome: PASS selected desktop/mobile flows. Correct answers in all six types; empty-answer warning, hinted confident error classification, single-view grading lock, bookmarked/reloaded review, conflicting filters, empty/targeted concept search, concept-to-question path. Diagnostic drafts/flags survive reload; cancelled submission stays active; two correct and eighteen unanswered yield 10/100 and twenty result entries; details reveal after submission.
- Backup UI: downloaded/cleared/restored synthetic records exactly; cancelled deletion and invalid JSON preserve records. Other synthetic app key preserved. Corrupt-version and quota injection display truthful memory-only warnings. IME composition dispatch guard is synthetic browser evidence, not a physical IME-device test.
- Mock UI: cancelled start creates no session; valid start and reload preserve draft/flag; practice navigation cannot reveal answers. Synthetic browser clock advance beyond 150 minutes auto-submits once and clears active session. This is NOT a real 150-minute human run.
- Print: separate A4 question and answer PDFs generated from UI; problem sheet contains no expected-answer elements, answer sheet contains twenty. Question pages 1–2 and answer page 1 visually rendered/reviewed; remaining print pages not individually visually reviewed.
- Layout: 1440×1000 desktop, 390×844 and 320×844 mobile SQL forms; document widths equal viewport widths. Selected screenshots reviewed, internal code/table scroll retained, keyboard focus outline observed, reduced-motion context. No uncaught JS errors in selected ordinary flows. Not a formal accessibility/all-browser audit or real-user study.
- Official criteria: practical pages 11–24 fully text-reviewed and page 11 rendered. See content-sources.md for coverage/limits. Temporary native programs, browser captures and synthetic backups remain outside dist.

## Remote

- Public repository created, Pages uses workflow deployment: https://github.com/HyungminYoon1/engineer-practice.
- Source `34a9d444616a97887414f4879b033a2646a4e0d0`: [Actions 38208133914](https://github.com/HyungminYoon1/engineer-practice/actions/runs/38208133914) verification and deployment SUCCESS, including native execution step on Ubuntu. This is separate from the Windows local run.
- Public [app](https://hyungminyoon1.github.io/engineer-practice/): HTTP 200 and exact local/public bytes for index, CSS and all six source modules (8 files). Index SHA-256 `a665e0eeab827919378670d854b0cda7cf34d7161010631171be6f86c53c9ec0`.
- Fresh isolated public Chrome: exact browser title ‘정보처리기사 실기 학습실’, normal practice navigation and correct typed C answer verified with no page errors. Full local regression is not relabelled as full live regression. No backend/Neon provisioned; no private user data sent or published.
- Subsequent evidence-only commit changes this document, not dist; its deployment may redeploy identical app bytes. Preserve the tested app revision above.
