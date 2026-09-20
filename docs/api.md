# Rogontra API (initial contract)

The owned API is versioned under `/api/v1`. Its current catalogue is seeded from `backend/products.json`; PostgreSQL will replace this temporary seed in the database milestone.

## Running locally

```bash
npm ci
npm run api:dev
```

The API listens on `http://localhost:3000` by default. Copy `.env.example` to `.env` to configure the port and permitted storefront origin.

## Endpoints

| Method | Path                          | Description                                                 |
| ------ | ----------------------------- | ----------------------------------------------------------- |
| `GET`  | `/api/v1/health`              | Service health and timestamp                                |
| `GET`  | `/api/v1/products`            | Local catalogue; accepts optional `q` search text           |
| `GET`  | `/api/v1/products/:productId` | One product by ID                                           |
| `POST` | `/api/v1/orders`              | Validates a cart and creates an awaiting-payment test order |
| `POST` | `/api/v1/quotes`              | Validates and records a sales-assisted quote request        |

Successful responses use a `data` envelope. List responses add `meta`; errors use an `error` object with a stable code and a safe message.

## Current limits

`POST /orders` trusts only a product ID, quantity, and delivery-option ID. It calculates all USD prices, shipping, tax, and delivery dates server-side. The response is explicitly an `awaiting_payment` test order; it does not collect payment and does not make an order eligible for fulfilment.

`POST /quotes` accepts requests only for quote-only catalogue items. The current implementation validates and returns a received request but does not persist it or notify sales; PostgreSQL and operational notifications are required before production use.

Authentication, product administration, persistent carts, payments, database migrations, and rate limiting arrive in later milestones. The temporary product content is inherited learning data and will be replaced with an original/licensed Rogontra catalogue before public launch.
