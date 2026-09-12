# Fitness Deep Read

Last updated: 2026-09-12
Review status: SOURCE-LEVEL RECONCILED; APPENDIX REMEDIATION VERIFIED
Scope actually read: recorded source scope for Fitness profile, Workout, Calisthenics, Gym and Yoga controllers/models/services/libraries/generators/coaching/analysis/specs, plus module registration and Personal Brain consumers, with Mobile fitness/pose contracts cross-checked.
Scope not yet read: real-device camera/pose execution, physical workout UX, deployed persistence/performance and external media/provider behavior.
Evidence roots: `apps/backend/src/modules/fitness/`; `workout/`; `calisthenics/`; `gym/`; `yoga/`; `personal-brain/`; `apps/mobile/`; Prisma schema; canonical Appendix.
Confidence level: HIGH for recorded source-level audit and remediation evidence; MEDIUM for camera/device execution.
Open questions: real-time pose quality, device performance, exercise-media provenance and final end-to-end fitness journey behavior.

## Current reconciled state

Fitness, Workout and discipline modules are authenticated in the relevant active paths. Historical controller-body/DTO gaps, timezone semantics, and Fitness profile dual-implementation risks were addressed or reclassified in the canonical remediation chain.

Workout/user behavior indexing was explicitly reconciled in the Prisma source. Yoga stale in-flight results and pose-session lifecycle safety were corrected where captured by the Appendix. Mobile and backend pose-provider contracts remain an architectural integration surface to keep aligned as camera coaching matures.

## Product boundary

The Vision still extends beyond current source completion: richer exercise media catalogs, equipment-aware plan generation, progression intelligence, local camera coaching/pose estimation and complete wearable/health integration require additional product work and device validation.

## Verification

Backend and Mobile CI passed on the verified remediation tree. CI does not validate real camera frames, pose accuracy, physical-device performance or coaching UX.
