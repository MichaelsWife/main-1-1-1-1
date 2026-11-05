---
name: supabase-postgres-best-practices
description: Use when designing or changing PostgreSQL schemas, SQL queries, indexes, connection pooling, transactions, or Row Level Security, especially for Supabase.
---

# PostgreSQL practices for Supabase

## Query performance
- Inspect query plans with `EXPLAIN (ANALYZE, BUFFERS)` on representative data before optimizing.
- Index columns used by frequent filters, joins, and ordering. Use composite indexes matching common filter/order patterns and partial indexes when queries target a stable subset.
- Select only needed columns, paginate large result sets, and batch writes instead of issuing one query per row.
- Avoid N+1 queries; use joins or batched lookups where appropriate.

## Connections and transactions
- Use Supabase's supported connection pooling mode for serverless workloads; choose direct connections only when the runtime and network require them.
- Keep transactions short, avoid idle transactions, and acquire locks in a consistent order.
- Use parameterized queries. Never interpolate untrusted values into SQL.

## Schema and security
- Prefer appropriate native PostgreSQL types, explicit constraints, lowercase snake_case identifiers, and stable primary keys.
- Index foreign-key columns when needed for join/delete performance.
- Enable RLS on tables in exposed schemas. Policies must scope access to the caller's own records, for example by matching `auth.uid()` to an ownership column; `TO authenticated` alone does not provide row-level authorization.
- UPDATE policies should constrain both existing rows (`USING`) and resulting rows (`WITH CHECK`). Do not use user-editable metadata to authorize access.
- Never expose service-role/secret keys or database connection URLs to clients.
- Review Supabase Database Advisors and the official Supabase PostgreSQL best-practices references for detailed guidance.
