# PB-254 — No composed account-erasure workflow found

- Status: PROVISIONAL — source-level finding; final severity/reconciliation pending.
- Location: backend account/auth/session lifecycle; repository-wide user deletion search.
- Problem: The repository exposes session deletion primitives (`SessionService.deleteByRefreshToken()` and `deleteAllForUser()`), but no composed account-erasure operation was found that deletes the canonical `User` record, invokes external Supabase/Auth deletion, removes storage/user-owned external data, and closes migration-only/user-sensitive persistence in one documented workflow.
- Evidence: repository search found session deletion methods but no `deleteUser`, `User.delete`, or `prisma.user.delete` implementation. Session cleanup is therefore not equivalent to account erasure. fileciteturn265file0
- Impact: A user-facing account-deletion requirement could be incomplete: authentication/session state may be removable while application data, external Auth identity, or storage objects remain. This is a privacy/retention closure risk until the deletion contract is explicitly implemented or documented as intentionally out of scope.
- Reconciliation: This finding is distinct from per-resource delete operations such as recipes, workouts, reminders, and memory facts; those operations are ownership-scoped resource deletion, not composed account erasure. fileciteturn265file2 fileciteturn265file3 fileciteturn265file7 fileciteturn265file8
