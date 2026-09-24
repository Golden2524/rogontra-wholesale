# Rogontra Wholesale

Rogontra Wholesale is a global B2B commerce platform for sourcing consumer goods, industrial equipment, heavy-duty machinery, trucks, trailers, and related parts. It is being rebuilt from a learning storefront into an original, production-minded full-stack application.

## Current status

The project is in active redevelopment. The existing interface demonstrates catalogue browsing, search, cart management, secure customer sign-up/sign-in and sign-out, checkout, customer order and quote history, and delivery tracking. Its former tutorial API and branding are being replaced; it must not be treated as a live store until the API, security, payment verification, and deployment milestones are complete.

## Product direction

- **Audience:** businesses, procurement teams, resellers, and industrial buyers worldwide.
- **Catalogue:** consumer wholesale, industrial equipment, heavy machinery, trucks, trailers, and spare parts.
- **Pricing:** USD is the source of truth for every product and order. Buyers will see a clearly labelled local-currency estimate where supported.
- **Payments:** the server will calculate the final USD order total, initiate payment, and verify the provider's confirmed settlement before an order is marked paid. Exchange-rate display is never accepted as the order's source of truth.
- **Order types:** standard checkout for eligible products; request-for-quote and sales-assisted fulfilment for high-value or configurable equipment.

## Target architecture

```
Browser storefront  ->  Rogontra API  ->  PostgreSQL
                            |                |
                            v                v
                    Payment provider     Product images
```

The storefront will use only the Rogontra API. No browser code will depend on the previous tutorial backend.

## Development roadmap

1. Establish documentation, tooling, and quality checks.
2. Build the owned API and a versioned product catalogue.
3. Add PostgreSQL, migrations, seed data, and authenticated customer accounts.
4. Rebrand and rebuild the storefront for wholesale and industrial purchasing.
5. Add cart, checkout, order, quote, inventory, and payment-verification workflows.
6. Test critical user journeys, deploy, document, and prepare portfolio materials.

Detailed scope and architecture decisions are in [`docs/product-brief.md`](docs/product-brief.md) and [`docs/architecture.md`](docs/architecture.md).

Deployment instructions and launch gates are in [`docs/deployment.md`](docs/deployment.md).

The ready-to-adapt LinkedIn/GitHub project narrative is in [`docs/portfolio-case-study.md`](docs/portfolio-case-study.md).

## Local setup

Install the project's development tooling and run the current checks:

```bash
npm ci
npm run format:check
npm run lint
npm test
```

Start the owned API with `npm run api:dev`, then run `npm run storefront:start` in another terminal. The API scripts load the ignored `.env.local` file automatically. The storefront uses `http://localhost:3000/api/v1` locally. Set `window.ROGONTRA_API_BASE_URL` before page scripts load when using another API deployment URL.

The API reads its catalogue from PostgreSQL. Run `npm run db:migrate` and `npm run db:seed` before starting the API; the current catalogue and submitted test orders are not production data.

## Catalogue administration

The demo items in `backend/rogontra-catalogue.json` are seeded as `Demo content` and can be replaced from the protected [admin page](admin.html). To bootstrap an administrator, first register a normal account, add that email as `ADMIN_EMAIL` in your private `.env.local`, then run `npm run admin:grant`. Sign out and sign in again so the account session receives the role. Open `admin.html` after that. The API checks the current database role on every administration request; hiding the admin page in the browser is not the security control.

Use project-relative image paths for assets you add to the repository or publicly hosted, licensed image URLs. Product records can be hidden instead of deleted, protecting historical order data.

Administrators can also use the quote desk to move requests through `received`, `reviewing`, `quoted`, `closed`, or `cancelled`. These statuses are customer-visible in account history; this workflow records progress only and does not send emails or create an invoice yet.

The order desk exposes the same operational safeguard: `not_collected` test orders cannot move into preparation or shipping. They can be cancelled, while fulfilment transitions will become available only when payment verification marks a future order as `paid`.

## Payments

The payment adapter initializes and verifies Paystack transactions from the server. Add a **test** `PAYSTACK_SECRET_KEY` and an absolute `PAYMENT_CALLBACK_URL` to `.env.local` before trying it; do not put the secret in browser code. It verifies the provider's reported reference, USD currency, and minor-unit amount against the saved order before marking an order paid. Paystack uses backend initialization and server-side verification for this flow. [Paystack transaction API](https://paystack.com/docs/api/transaction/)

USD remains the order source of truth. A later foreign-exchange integration must quote and lock a supported local-currency amount server-side before the provider is initialized; browser-side conversion is deliberately not treated as a payment amount.

## Portfolio notes

Before public release, the project will include an original visual identity, owned/licensed catalogue imagery, tests, deployment instructions, architecture documentation, screenshots, accessibility checks, and an honest feature/status summary.

The linked privacy, terms, shipping, and refund pages are intentionally labelled as pre-launch drafts. Replace every bracketed business detail and obtain qualified legal and operational approval before publishing them as real policies.
