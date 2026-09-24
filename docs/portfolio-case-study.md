# Rogontra Wholesale — portfolio case study

## Overview

Rogontra Wholesale is an original full-stack B2B marketplace concept for wholesale supplies, industrial parts, heavy equipment, commercial trucks, and trailers. I rebuilt a learning storefront into a production-minded application with owned branding, an owned API, PostgreSQL persistence, customer accounts, administration tools, and payment safety controls.

## Problem

Wholesale and industrial purchasing has two distinct journeys: standard, lower-value items need a fast cart and order path, while machinery and configurable fleet assets need a sales-assisted quote process. The project needed to support both without letting the browser control prices, inventory decisions, payment status, or administrator access.

## What I built

- A responsive wholesale catalogue with clear USD pricing, stock state, minimum order quantity, and quote-only equipment.
- Customer registration, sign-in, session handling, orders, quotes, and order tracking.
- An owned Express API with validation, server-side cart pricing, JWT authentication, password hashing, CORS rules, and versioned endpoints.
- PostgreSQL migrations and an idempotent illustrative seed catalogue on Supabase.
- A role-protected admin workspace to manage products, quote workflows, and payment-aware order workflows.
- A Paystack payment adapter that initializes and verifies transactions server-side and matches reference, currency, and amount before an order can become paid.
- Automated tests, linting, formatting, CI, health/readiness checks, and host-neutral deployment guidance.

## Technical highlights

| Area                  | Decisions                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Authoritative pricing | The API calculates USD cents from server-side products and cart quantities.                                          |
| Payment safety        | Provider secrets remain server-only; payment verification checks the saved provider reference, amount, and currency. |
| Roles                 | Admin access is verified against the current PostgreSQL role for each admin API request.                             |
| Catalogue safety      | Demo products are explicitly marked and can be replaced or hidden through administration.                            |
| Operations            | Quote and order states are constrained in PostgreSQL and validated in the API.                                       |
| Accessibility         | Keyboard skip links, focus visibility, labels, live status feedback, and descriptive product images are included.    |

## Current status

This is a development portfolio project, not a live marketplace. The included catalogue is illustrative, orders are test-mode until Paystack is fully verified, and local-currency settlement requires a future licensed FX quote/lock service. Legal, tax, shipping, privacy, refund, and terms content must be approved before public launch.

## How to present it

Use the catalogue screenshot to show the B2B/industrial product direction, the customer account screenshot to show end-to-end account work, and the admin workspace after replacing demo products with approved records. Explain the security choices: prices and payments are verified by the backend, not trusted from the browser.
