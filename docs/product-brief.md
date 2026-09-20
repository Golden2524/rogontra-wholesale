# Rogontra Wholesale product brief

## Purpose

Rogontra Wholesale helps business buyers discover, compare, request quotes for, and purchase wholesale and industrial products internationally.

## Product catalogue model

The catalogue will support distinct purchase paths rather than pretending every item can be shipped or paid for identically.

| Catalogue area | Examples | Purchase path |
| --- | --- | --- |
| General wholesale | apparel, home goods, consumables | cart and checkout |
| Commercial vehicles | trucks, trailers | enquiry or request for quote, then sales-assisted order |
| Heavy equipment | excavators, loaders, Caterpillar-compatible equipment | enquiry or request for quote, shipping review |
| Parts and accessories | filters, tyres, components | cart or quote, depending on stock and value |

Product records will include SKU, brand, category, base USD price, stock status, minimum order quantity, product condition, specifications, media, shipping constraints, and quote eligibility.

## Currency and payments

- Every product price, discount, shipping estimate, and order record is calculated and stored in integer USD cents.
- Currency conversion is a display convenience. It will use an attributable rate, timestamp, and disclaimer that final provider charges may vary.
- Buyers can select a supported payment currency. The payment integration will expose only currencies and methods that the chosen provider supports for the merchant account and buyer location.
- The API—not the browser—calculates totals, creates payment attempts, and verifies a successful provider response or webhook before it marks an order paid.
- Large machinery orders will begin with request-for-quote, invoice, and bank-transfer/sales approval flows; no automated card checkout until business operations, fraud controls, taxes, export, and shipping rules are ready.

## First release boundaries

The first public release will deliver a usable catalogue, search and filtering, cart, customer accounts, verified test-mode payment, orders, and quote requests. Seller onboarding, auction workflows, fleet financing, customs automation, multilingual content, and live payment credentials are explicitly later milestones.

## Non-negotiable quality requirements

- Original Rogontra branding, copy, UI, and assets with documented licences.
- Responsive keyboard-accessible user interface.
- Server-side validation, rate limiting, secure password storage, and protected secrets.
- Automated tests for pricing, cart validation, authentication, payment verification, and the core browse-to-order journey.
- No payment secret or database credential committed to source control.
