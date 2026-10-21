# Supabase migrations: grants rule (from 30 Oct 2026)

Supabase no longer gives the Data API (supabase-js, PostgREST, GraphQL)
access to **new** tables in `public` automatically. Every `create table`
in a migration needs its grants in the same file, or the app gets
"permission denied".

Internal project tables are used only by the server (service role):

```sql
grant select, insert, update, delete on table public.<table> to service_role;
grant usage, select on sequence public.<table>_id_seq to service_role;
```

Only add `anon` / `authenticated` grants (plus RLS policies) for a table the
browser reads directly with the public key.

Run order for the internal project: `internal-base-schema.sql`,
`land-leads-schema.sql`, `brands-projects-schema.sql`,
`construction-fees-schema.sql`.
