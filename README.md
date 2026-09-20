# Rogontra Wholesale

Rogontra Wholesale is a global B2B commerce platform for sourcing consumer goods, industrial equipment, heavy-duty machinery, trucks, trailers, and related parts. It is being rebuilt from a learning storefront into an original, production-minded full-stack application.

## Current status

The project is in active redevelopment. The existing interface demonstrates catalogue browsing, search, cart management, checkout, orders, and delivery tracking. Its former tutorial API and branding are being replaced; it must not be treated as a live store until the API, security, payment verification, and deployment milestones are complete.

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

## Local setup

Install the project's development tooling and run the current checks:

```bash
npm ci
npm run format:check
npm run lint
npm test
```

Application server setup instructions will be added with the owned backend in the next implementation milestone. Until then, use a local static server to preview the legacy front end; it currently relies on an external tutorial API and is not a production environment.

## Portfolio notes

Before public release, the project will include an original visual identity, owned/licensed catalogue imagery, tests, deployment instructions, architecture documentation, screenshots, accessibility checks, and an honest feature/status summary.
