# PostgreSQL database

Rogontra stores money in integer USD cents. Local-currency figures are display or provider-payment values; they are never the source of truth for an order total.

## Apply the initial schema

1. Create a PostgreSQL database and copy its connection string into your uncommitted `.env.local` file as `DATABASE_URL`.
2. Run `npm run db:migrate` from the project root.
3. Run `npm run db:status` to confirm that the `schema_migrations` table contains `001_initial_schema`.

The migration is idempotent, so it can be safely rerun. Do not use a production database to experiment with sample data.

## Seed the development catalogue

Run `npm run db:seed` after migrations to import the illustrative catalogue. It is safe to rerun and updates existing seed products by their `external_id`. Replace this seed data with approved products and media before launch.

Run `npm run db:catalogue-status` to confirm the imported product, quote-only product, and category counts without exposing database credentials.

`npm run db:verify-persistence` creates one synthetic `.invalid` quote and one `awaiting_payment` test order in the development database, then confirms their persisted records. Do not run it against production.

## Before production

- Run migrations through a managed deployment pipeline.
- Set database backups, restricted network access, and least-privilege application credentials.
- Add migration version checks before adding later migrations.
- Replace the current in-memory catalogue/order/quote services with database repositories.
