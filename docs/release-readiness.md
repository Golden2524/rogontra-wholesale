# Rogontra release readiness

This checklist separates a portfolio demonstration release from a real commercial launch. A deployed portfolio demo must be honest about demo inventory and test payments. A public commercial store has additional legal, operational, and financial obligations.

## Portfolio deployment checklist

- [x] Owned brand identity, catalogue flows, account flows, quote requests, administration, and server-priced order workflow.
- [x] PostgreSQL migrations, repeatable illustrative catalogue seed, and protected customer/admin API routes.
- [x] Automated formatting, linting, and critical-path tests.
- [x] Baseline HTML quality guard for document language, encoding, viewport metadata, and unique page titles.
- [x] Health and database-readiness endpoints, production configuration preflight, and portable API container package.
- [x] Deployment guide, architecture/API documentation, payment/currency roadmap, and LinkedIn case-study draft.
- [ ] Complete a browser walkthrough on desktop and mobile-sized layouts.
- [ ] Capture original screenshots of the real Rogontra interface and add them under `docs/screenshots/`.
- [x] Select hosting, configure a public HTTPS storefront and API, then set the production environment variables.
- [x] Run migrations in the chosen production database and verify the deployed `/api/v1/ready` endpoint.
- [x] Configure the public API and storefront URLs, then run the read-only `npm run deploy:smoke` check.
- [ ] Replace the illustrative items with clearly licensed portfolio imagery, or retain their visible demo labels.
- [ ] Run a deployed smoke test: catalogue search, registration/sign-in, quote request, test order, account history, and admin access.
- [ ] Review the deployed site, README, and case-study language so it says “portfolio demo” until the commercial items below are complete.

## Commercial launch checklist

- [ ] Enter real products, supplier details, accurate prices, stock/lead times, minimums, freight restrictions, and licensed images.
- [ ] Approve completed privacy, terms, shipping, refund, tax, and data-retention policies with qualified legal and operational advice.
- [ ] Define who fulfils each product class, how cross-border shipping and customs work, and how customer support handles cancellations and disputes.
- [ ] Configure production payment credentials, complete a test-to-live payment verification, and reconcile a real payment with the order workflow.
- [ ] Choose and integrate a server-side FX quote provider before accepting non-USD settlement. USD remains the accounting source of truth.
- [ ] Add a production-grade shared rate-limit, monitoring, backups, incident contacts, and a plan for account/data requests.
- [ ] Carry out security review and accessibility review against the final deployed site.

## Decision rule

Rogontra is ready to be posted on LinkedIn only when every portfolio checklist item is complete and the live link is verified. It is ready to accept public commercial orders only when every commercial launch item is also complete.
