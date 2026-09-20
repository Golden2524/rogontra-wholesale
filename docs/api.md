# Rogontra API (initial contract)

The owned API is versioned under `/api/v1`. Its current catalogue is seeded from `backend/products.json`; PostgreSQL will replace this temporary seed in the database milestone.

## Running locally

```bash
npm ci
npm run api:dev
```

The API listens on `http://localhost:3000` by default. Copy `.env.example` to `.env` to configure the port and permitted storefront origin.

## Endpoints

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| `GET`  | `/api/v1/health`              | Service health and timestamp                      |
| `GET`  | `/api/v1/products`            | Local catalogue; accepts optional `q` search text |
| `GET`  | `/api/v1/products/:productId` | One product by ID                                 |

Successful responses use a `data` envelope. List responses add `meta`; errors use an `error` object with a stable code and a safe message.

## Current limits

This API is intentionally read-only. Authentication, product administration, persistent carts, orders, payments, database migrations, and rate limiting arrive in later milestones. The temporary product content is inherited learning data and will be replaced with an original/licensed Rogontra catalogue before public launch.
