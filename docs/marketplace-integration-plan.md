# Helen Wholesale marketplace integration plan

Helen Wholesale will become the client’s central catalogue and shared-stock system. Jumia is the first planned marketplace connection; Amazon UK is second. The client fulfils orders directly.

## Current status

- Jumia: not connected. The client has not yet opened a seller account.
- Amazon UK: not connected. The client has not yet opened a seller account.
- Other marketplaces: not selected or connected.
- Helen Wholesale: a deployed demonstration only. Its inventory, catalogue, orders, and payments are not ready for commercial operation.

## Sync model

Helen Wholesale should own a canonical product SKU and available quantity. Each marketplace listing must map to exactly one Helen Wholesale SKU. A confirmed sale on any connected channel must reduce the shared available quantity before an updated quantity is sent to the other connected channels. The implementation must include idempotent order imports, audit logs, retry handling, stock-reservation rules, and a manual reconciliation process. Until that work is finished, staff must not represent stock as synchronised.

## Jumia-first prerequisites

1. The client creates and completes verification for the appropriate Jumia seller account.
2. The client confirms each target Jumia country/marketplace and whether the products are allowed there.
3. The client obtains approved integration access from Jumia for the relevant seller account.
4. The client provides approved product data: SKU, title, category, price, stock, images, weights/dimensions, and fulfilment/returns terms.
5. Helen Wholesale creates a secure server-side connection. Credentials are never placed in browser code, product forms, Git, screenshots, or chat.
6. Test product and order synchronization in the provider’s supported test process before any live listing is enabled.

## Amazon UK prerequisites

1. The client opens an Amazon UK Professional seller account and completes verification.
2. The client registers or authorizes the required Selling Partner API access.
3. The client provides product identifiers and required category/listing data.
4. Helen Wholesale connects through server-side authorization, tests order and inventory synchronization, and verifies direct-fulfilment workflows before enabling live updates.

## Fulfilment rules to decide before live sync

- Dispatch locations and shipping carriers.
- Service levels and delivery promises per country.
- Returns, cancellations, refunds, customer support, VAT/customs, and product compliance.
- How stock is reserved when two channels sell the last unit at the same time.
- Who monitors failed synchronizations and marketplace policy notifications.

## Security rule

Do not share marketplace passwords, API keys, refresh tokens, or seller credentials in chat, the browser, Git, screenshots, or client-side JavaScript. Store credentials only as protected server-side environment variables after seller authorization is approved.
