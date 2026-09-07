# 2026-09-07 Security advisor refresh

Fresh Supabase security advisor verification was performed against content project `zoillvqgaxwlawgmbjhs`.

The advisor initially reported WARN findings for `public.rls_auto_enable()` being executable by `anon` and `authenticated`. The earlier revokes on those roles were not sufficient because the function still inherited EXECUTE from `PUBLIC`.

Applied:

```sql
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public;
```

A fresh advisor run immediately afterward reports no SECURITY WARN findings. Remaining advisor findings are INFO-level `rls_enabled_no_policy` notices for tables that intentionally have RLS enabled without policies, including `recipe_image_import_attempts` and several catalog/recipe relation tables.

Security is therefore not represented as completely lint-free; the material SECURITY DEFINER warnings are cleared and the remaining INFO notices are explicitly retained for later policy review.
