# PostgreSQL database

Rogontra stores money in integer USD cents. Local-currency figures are display or provider-payment values; they are never the source of truth for an order total.

## Apply the initial schema

1. Create a PostgreSQL database and copy its connection string into your uncommitted `.env` file as `DATABASE_URL`.
2. Run `npm run db:migrate` from the project root.
3. Confirm that the `schema_migrations` table contains `001_initial_schema`.

The migration is idempotent, so it can be safely rerun. Do not use a production database to experiment with sample data.

## Before production

- Run migrations through a managed deployment pipeline.
- Set database backups, restricted network access, and least-privilege application credentials.
- Add migration version checks before adding later migrations.
- Replace the current in-memory catalogue/order/quote services with database repositories.
