#!/usr/bin/env bash
# Testovi sigurnosnih pravila (RLS, triggeri, provjera dobi, pretraga) nad lokalnim Supabaseom.
#   npm run db:reset && npm run db:test
# Bez Dockera: STUB=1 PGHOST=... PGPORT=... PGUSER=postgres npm run db:test
#   (čisti PostgreSQL + minimalna imitacija Supabasea iz tests/db/stub_supabase.sql)
set -euo pipefail
filter() { grep -v -E '^\s*$|^ *[0-9a-f-]{36}$' || true; }

if [[ "${STUB:-}" == "1" ]]; then
  DB=petica_test
  psql -d postgres -q -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB" >/dev/null
  psql -d postgres -q -c "do \$\$ begin create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; exception when duplicate_object then null; end \$\$" >/dev/null
  for f in tests/db/stub_supabase.sql supabase/migrations/*.sql supabase/seed.sql; do
    psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null 2>&1 || { echo "GREŠKA u $f"; psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f"; exit 1; }
  done
  psql -d "$DB" -q -t -v ON_ERROR_STOP=1 -f tests/db/rls_test.sql | filter
else
  DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
  psql "$DB_URL" -q -t -v ON_ERROR_STOP=1 -f tests/db/rls_test.sql | filter
fi
