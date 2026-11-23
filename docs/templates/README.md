# Helen Wholesale client data templates

These CSV files open in Microsoft Excel and Google Sheets. They are preparation files only: uploading or completing them does not publish products or connect Jumia.

## Catalogue template

Complete one row per product or sellable variation in `helen-wholesale-catalogue-template.csv`.

Required fields before a listing can be reviewed:

- `helen_sku`: the unique, permanent identifier Helen Wholesale will use everywhere.
- `product_name`, `category`, `description`, and `primary_image_url`.
- `currency`, `price`, and the current sellable `available_quantity`.
- `target_jumia_market`: use the country/marketplace the client is approved to sell in.
- `listing_approval`: leave `Not reviewed` until the client approves the complete row. Valid values are `Not reviewed`, `Approved`, `Needs changes`, and `Do not list`.

Use a separate SKU for each independently sellable size, colour, pack, or other variation. Quantity must describe physically sellable stock that the client can fulfil directly; do not use uncertain supplier stock. Images must be licensed for the client’s commercial use.

## Fulfilment template

Complete one row per marketplace and dispatch arrangement in `helen-wholesale-fulfilment-template.csv`.

Record only operational details: dispatch location, carrier/delivery partner, handling time, and the person responsible for returns. Do not include customer data, bank details, passwords, API keys, tokens, or seller logins.

## Handoff

When the client has a verified Jumia seller account and approved integration access, return the completed CSV files. Helen Wholesale will validate the data, map approved SKUs to marketplace listings, then test inventory and order synchronization before any live channel is enabled.

Project maintainers can run the same preflight check before import:

```sh
npm run marketplace:validate -- helen-wholesale-catalogue-template.csv helen-wholesale-fulfilment-template.csv
```

The check only reads the CSV files. It does not call a marketplace, save credentials, publish listings, or change inventory.
