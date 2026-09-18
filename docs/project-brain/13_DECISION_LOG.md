# Decision Log

Last updated: 2026-09-18
Review status: PRE-DEVICE ENGINEERING GATES GREEN / PHYSICAL-DEVICE VALIDATION REMAINS
Scope: audit governance, remediation decisions and current verification gates.

| Date | Decision | Reason | Evidence |
|---|---|---|---|
| 2026-09-11 | Treat `main` as the fresh audit target. | The user's new instruction asks to restart; historical audit branch is divergent from current main. | Remote compare result. |
| 2026-09-11 | Do not use historical Project Brain as proof of current behavior. | Historical audit branch diverges from `main`. | Remote compare result. |
| 2026-09-11 | Keep the audit conservative where local verification is unavailable. | Container could not clone because DNS resolution for github.com failed. | Local command result. |
| 2026-09-13 | Treat the canonical Android APK workflow as the native evidence gate. | Repository-level mobile CI does not prove a native APK build. | `.github/workflows/android-apk.yml`. |
| 2026-09-13 | Do not close Android evidence merely because a run reaches Gradle. | Run `34770782835` reproduced a native autolinking compile failure. | Workflow job logs / generated `PackageList.java`. |
| 2026-09-13 | Strengthen pnpm hoisting rather than claiming the Expo autolinking issue fixed. | `node-linker=hoisted` alone did not prevent the legacy `expo.core.ExpoModulesPackage` import. | Failed native run `34770782835`; `.npmrc` remediation. |
| 2026-09-13 | Record the native autolinking defect as PB-268 until a fresh native run proves the fix. | Evidence-based audit status must distinguish remediation from verification. | `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. |
| 2026-09-13 | Close PB-268 only after the fresh native run completes Gradle and artifact upload successfully. | The successful build is the required native evidence, not merely prebuild success. | Run `34772364209` on `0d19d2b7dad5e9100505205328fbd523e544445b`. |
| 2026-09-13 | Treat Android native repository verification as GREEN after run #79. | The run completed Expo prebuild, real Gradle `assembleDebug`, and APK artifact upload successfully. | Artifact `my-personal-assistant-debug-apk`, SHA-256 `622b90eeef0898ab7d3eac9af75fac6e486da46eb4f741116d601f3d727f23da`. |
| 2026-09-13 | Keep physical-device and production controls explicitly unvalidated. | Those environments are unavailable to repository CI evidence. | Security/privacy and open-work evidence boundary. |

## 2026-09-18 — Pre-device gate closure

| Decision | Reason | Evidence |
|---|---|---|
| Treat local PostgreSQL + Prisma as canonical development infrastructure. | Supabase is explicitly out of the current architecture and VPS is deferred to release. | Current-state architecture and local validator evidence. |
| Treat `useAppLocale()` as the shared mobile presentation-language source. | Route-local locale state caused stale/duplicated presentation state. | PB-272..PB-275 remediation and green Mobile CI. |
| Treat canonical `LifeTaskDependency/LifeTaskEvent` as the active planning persistence path. | Legacy compatibility tables were still referenced by Smart Planning fallback. | PB-276 and Backend CI run 35377244969. |
| Treat physical mobile behavior as the remaining product gate. | Repository and local engineering validation cannot prove device translation/TTS/RTL capabilities. | 09_TEST_AND_VALIDATION_MATRIX.md and current device evidence boundary. |

## Current verification policy

A work item is marked green only after implementation, relevant automated validation and Project Brain documentation agree. A remediation commit is not itself proof of successful validation. Failed native CI findings must remain represented in the appendix until a fresh successful run closes them; PB-268 now satisfies that closure condition at repository-CI level.