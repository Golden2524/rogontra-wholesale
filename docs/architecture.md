# Architecture decisions

## Chosen baseline

The project will evolve in place using a static JavaScript storefront and an owned Node.js/Express API backed by PostgreSQL. This keeps the existing implementation understandable while adding the full-stack practices required for a professional portfolio.

## Service boundaries

| Layer | Responsibility | Must not do |
| --- | --- | --- |
| Storefront | rendering, interaction, accessible forms, API requests | calculate authoritative totals or handle payment secrets |
| API | authentication, validation, pricing, stock checks, orders, quotes, payment initiation and verification | trust a browser-supplied price or payment status |
| Database | durable users, products, inventory, carts, orders, quotes, payment attempts | contain application secrets |
| Payment service | collect and settle payment | decide whether Rogontra fulfils an order |

## Core entities

`users`, `addresses`, `categories`, `products`, `product_media`, `inventory`, `carts`, `cart_items`, `orders`, `order_items`, `quotes`, and `payment_attempts` will form the initial data model.

## Pricing rule

The API derives the USD cents total from current server-side product prices and quantities. Any local-currency figure is an estimate or an approved provider payment option. A payment record must be verified before fulfilment or paid status is set.

## Deployment direction

The frontend and API will deploy separately. Environment-specific URLs and secrets will be configured in the hosting dashboards, never hard-coded in JavaScript. The final deployment guide will identify the selected database, API host, frontend host, domains, health check, and rollback steps.
