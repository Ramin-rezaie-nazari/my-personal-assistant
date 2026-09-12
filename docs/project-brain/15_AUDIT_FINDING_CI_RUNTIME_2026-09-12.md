# CI/runtime verification findings — 2026-09-12

## CI-RUNTIME-001 — UserBehavior schema/migration drift

- Status: REMEDIATED / RUNTIME VERIFIED
- Location: Prisma schema, historical migration chain, `20260911123000_add_user_time_indexes`, `20260912070000_add_user_behavior_table`
- Evidence: clean GitHub Actions backend migration run first failed with PostgreSQL `42P01 relation "UserBehavior" does not exist`; the repaired follow-up run applied all migrations successfully and the idempotency pass reported no pending migrations.

## CI-RUNTIME-002 — Backend build contract drift

- Status: REMEDIATION APPLIED / RERUN PENDING
- Evidence: real backend CI build exposed six TypeScript contract errors: unsupported Nest exception class, optional fitness duration mismatch, missing fitness unlock list contract, missing workout recent/record contract, missing coach message build contract.
- Remediation: source fixes applied; rerun required.

## CI-RUNTIME-003 — Mobile dependency/API/typecheck drift

- Status: OPEN
- Evidence: real mobile CI frozen install passes but TypeScript fails on missing native dependencies (`expo-location`, `expo-av`, `expo-file-system/legacy`, `expo-speech`, `react-native-sherpa-onnx`), Expo Camera API mismatch, unsupported icon literal, and TTS/voice typing issues.
- Remediation: `voice-language.ts` restored; native dependency and remaining API/type fixes still open.
