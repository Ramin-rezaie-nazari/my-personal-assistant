# Open Work / Issue Catalog

Last updated: 2026-09-12
Review status: RECONCILED — historical issue catalog retained for traceability

This file preserves the original audit issue catalog and locations for traceability. The canonical current status of PB-001..PB-257 is maintained in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. Findings that were originally marked OPEN are not evidence of current defects. Current remediation status must be taken from the Appendix and its cited source/CI evidence.

## Current closure state

- Canonical findings catalog: `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`
- Current repository remediation branch: `audit/project-brain-2026-09-11`
- Current verification is evidence-driven. No finding is considered production/runtime green solely because this historical catalog contains a closed label.
- Historical evidence-limited / withdrawn / reclassified findings remain preserved in the Appendix and are not reopened merely because the original wording appears below in historical records.

## Historical issue index

The original PB-001..PB-257 records and their locations remain available in git history and the canonical Appendix. For current work, use the Appendix rather than treating this historical snapshot as an actionable open queue.

## Verification boundary

Source remediation has been applied on the audit branch. Backend and Mobile CI evidence must be checked against the latest branch HEAD after material changes. Runtime production deployment, live database state, device behavior and deployment-edge controls are not inferred unless explicitly evidenced.

## Next

Use `15_AUDIT_FINDINGS_APPENDIX.md` as the active findings register. Continue remediation only for findings that fail current source/test/CI re-verification or are explicitly classified as evidence-limited and pending environmental validation.
