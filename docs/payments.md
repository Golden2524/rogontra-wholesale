# Payments and currencies

## Current payment safety model

Every order is priced and stored in USD cents. The browser never supplies an amount to the payment provider. The API initializes the provider with the server-calculated amount, saves the provider reference, and verifies the provider's returned reference, currency, and minor-unit amount before changing an order to `paid`.

Paystack supports ISO 4217 currencies in minor units, but the currencies an individual business can accept depend on its Paystack market and enabled account capabilities. Rogontra must discover and configure those account-specific settlement currencies before showing them to buyers. See the [Paystack API reference](https://paystack.com/docs/api/) and [international-payment availability](https://support.paystack.com/en/articles/2130690).

## Multi-currency roadmap

The desired experience is: a buyer sees the USD source price, chooses a supported payment currency, receives a short-lived quote, and pays exactly the quote's minor-unit amount.

Before enabling a non-USD currency, the platform needs all of the following:

1. A licensed foreign-exchange quote provider and credentials.
2. The actual list of currencies enabled for the Rogontra Paystack account.
3. A database record for each quote: source USD amount, target currency, rate, rounded minor-unit amount, expiry, and provider reference.
4. Server-side quote expiry and verification that locks the chosen target amount into the payment attempt.
5. A clear buyer disclosure showing the exchange rate, expiry, and any provider fees.

Until those are in place, Rogontra accepts USD only. This avoids presenting an estimate as a payable amount or promising currencies the payment account cannot settle.
