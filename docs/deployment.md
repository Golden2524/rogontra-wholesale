# Deployment checklist

This guide is host-neutral: deploy the static storefront and Node API separately, with Supabase PostgreSQL as the database. Select hosts only after confirming their current regional availability, domain support, log retention, pricing, and security requirements.

## API service

1. Set the service start command to `npm run api:start`.
2. Set the health check to `GET /api/v1/health` and the readiness check to `GET /api/v1/ready`.
3. Configure these private environment variables in the host dashboard, never in Git:
   - `DATABASE_URL`
   - `JWT_SECRET` (a unique high-entropy production value)
   - `CORS_ORIGIN` (the exact deployed storefront origin; comma-separate deliberate additional origins)
   - `PAYSTACK_SECRET_KEY` and `PAYMENT_CALLBACK_URL` only after Paystack test-to-live verification
   - `PORT` only if the host requires it
4. Run `npm run db:migrate` against the production database before deploying application code that needs a new migration.
5. Confirm `/api/v1/ready` returns 200 after deployment.
6. Terminate TLS at the host or a managed reverse proxy, redirect HTTP to HTTPS, and enable HSTS only after the HTTPS domain is stable. The API already emits restrictive content, frame, referrer, permissions, and MIME-sniffing headers plus an `X-Request-Id` for support diagnostics.
7. Use host-level or shared rate limiting for authentication, payment, quote, and administration endpoints. The application can run on multiple instances, so an in-memory limit would not be sufficient protection in production.

### Container option

The included `Dockerfile` packages only the Node API and its production dependencies. Any container-capable host can build it from the repository root, expose port `3000`, and supply the same private environment variables above. The static storefront remains a separate deployment because it needs its own public API base URL. Do not place `.env.local` inside the image or repository.

## Static storefront

1. Deploy the project root as static files, excluding `.env.local`, `node_modules`, and backend-only configuration.
2. Configure `window.ROGONTRA_API_BASE_URL` before page scripts load to point to the deployed API URL plus `/api/v1`.
3. Add the exact storefront HTTPS origin to API `CORS_ORIGIN`.
4. Update `PAYMENT_CALLBACK_URL` to the deployed HTTPS `payment-return.html` address before enabling payment tests.
5. Keep `robots.txt` at the static site root. It supplements the page-level `noindex` metadata for account, checkout, administration, payment, tracking, and pre-launch legal pages.

## Release checks

Run `npm ci`, `npm run format:check`, `npm run lint`, and `npm test`. In the deployment environment, run `npm run deploy:check`; it validates only the presence and safe shape of required production values and never prints secrets. It requires a PostgreSQL URL, a 32+ character JWT secret, exact HTTPS storefront origins, and paired HTTPS Paystack callback settings if payments are configured.

After deployment, set the public `ROGONTRA_API_BASE_URL` (ending in `/api/v1`) and `ROGONTRA_STOREFRONT_URL`, then run `npm run deploy:smoke`. This read-only check verifies HTTPS, the storefront response, API health/readiness, response headers, and a non-empty catalogue. Then manually verify catalogue browsing, sign-up/sign-in, a quote request, an order, its account history, and administrator access using non-production test data. Confirm API responses retain the `X-Request-Id` when testing an error. Do not enable real payments until a test payment has returned through the callback and has been server-verified.

## Current launch blockers

The seed catalogue is illustrative, payment configuration is test-only until verified, no FX quote provider has been selected for non-USD settlement, and the included legal pages are clearly labelled pre-launch drafts that still require approved business content. Tax, shipping, refund, privacy, and terms policies are launch gates, not cosmetic follow-ups. Delivery addresses are stored as order fulfilment snapshots, so production access controls, retention schedules, and deletion/export workflows must be approved before public launch.
