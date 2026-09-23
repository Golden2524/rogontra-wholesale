# Rogontra API (initial contract)

The owned API is versioned under `/api/v1`. In normal server operation, its catalogue is read from PostgreSQL. `backend/rogontra-catalogue.json` is only an idempotent illustrative seed source for development.

## Running locally

```bash
npm ci
npm run api:dev
```

The API listens on `http://localhost:3000` by default. Copy `.env.example` to `.env.local` to configure the port, database, JWT secret, and permitted storefront origin. Keep `.env.local` private.

## Endpoints

| Method  | Path                                         | Description                                                   |
| ------- | -------------------------------------------- | ------------------------------------------------------------- |
| `GET`   | `/api/v1/health`                             | Service health and timestamp                                  |
| `GET`   | `/api/v1/products`                           | Local catalogue; accepts optional `q` search text             |
| `GET`   | `/api/v1/products/:productId`                | One product by ID                                             |
| `POST`  | `/api/v1/orders`                             | Validates a cart and creates an awaiting-payment test order   |
| `POST`  | `/api/v1/quotes`                             | Validates and records a sales-assisted quote request          |
| `POST`  | `/api/v1/auth/register`                      | Creates a customer account and returns a signed session token |
| `POST`  | `/api/v1/auth/login`                         | Verifies credentials and returns a signed session token       |
| `GET`   | `/api/v1/auth/me`                            | Returns the current session identity; requires a bearer token |
| `GET`   | `/api/v1/account/orders`                     | Returns only the signed-in customer's orders                  |
| `GET`   | `/api/v1/account/orders/:id`                 | Returns one signed-in customer's order and its item snapshots |
| `GET`   | `/api/v1/account/quotes`                     | Returns only the signed-in customer's quote requests          |
| `POST`  | `/api/v1/account/orders/:id/payment`         | Initializes a server-priced payment attempt for an order      |
| `POST`  | `/api/v1/account/payments/:reference/verify` | Verifies a payment provider result server-side                |
| `GET`   | `/api/v1/admin/products`                     | Lists all products for an administrator                       |
| `POST`  | `/api/v1/admin/products`                     | Creates an administrator-managed real product                 |
| `PUT`   | `/api/v1/admin/products/:id`                 | Updates or hides an administrator-managed product             |
| `GET`   | `/api/v1/admin/quotes`                       | Lists sales-assisted quote requests for an administrator      |
| `PATCH` | `/api/v1/admin/quotes/:id`                   | Updates a quote workflow status                               |
| `GET`   | `/api/v1/admin/orders`                       | Lists orders for an administrator                             |
| `PATCH` | `/api/v1/admin/orders/:id`                   | Updates an order fulfilment status                            |

Successful responses use a `data` envelope. List responses add `meta`; errors use an `error` object with a stable code and a safe message.

## Current limits

`POST /orders` trusts only a product ID, quantity, and delivery-option ID. It calculates all USD prices, shipping, tax, and delivery dates server-side, then records the `awaiting_payment` test order and its item snapshots in PostgreSQL. It does not collect payment and does not make an order eligible for fulfilment.

`POST /quotes` accepts requests only for quote-only catalogue items and persists a received request in PostgreSQL. It does not yet notify sales; operational notifications are required before production use.

Authentication uses a server-configured `JWT_SECRET` and bcrypt password hashes. Browser clients must never receive a password hash or the JWT secret.

Creating orders and quote requests requires a bearer token. New records are linked to that authenticated user; account-history endpoints never accept a user ID from the browser.

Administrator routes require a bearer token whose user currently has the `admin` role in PostgreSQL. The starter catalogue is tagged as demo content; admin-created or admin-updated products are marked as non-demo.

Only an order with a future verified `paid` payment status can enter fulfilment stages. Before payment integration is added, orders use `not_collected` and may only be cancelled by the administrator.

Payment initialization uses the order's server-calculated USD cents, never a browser-submitted amount. The server stores the provider reference and verifies the provider-reported reference, currency, and amount before changing an order to `paid`.

Product administration, persistent carts, payments, and rate limiting arrive in later milestones. The temporary product content is illustrative and must be replaced with approved Rogontra catalogue records and licensed media before public launch.
