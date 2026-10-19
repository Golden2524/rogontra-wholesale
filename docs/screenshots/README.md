# Screenshot checklist

Use this plan after the browser walkthrough succeeds. Capture the real Rogontra interface only—never Amazon branding, tutorial assets, credentials, database URLs, payment references, or real customer information.

## Before capturing

1. Run `npm run api:start` and `npm run storefront:start` in separate terminals.
2. Open `http://localhost:5500` and confirm the illustrative-catalogue notice is visible.
3. Use a desktop viewport around `1440 × 900` and a mobile viewport around `390 × 844`.
4. Use only synthetic details, such as `Demo Procurement Ltd`, `Portfolio Buyer`, and `demo@example.invalid`.
5. Keep the browser chrome out of the capture when possible. Prefer viewport screenshots over stitched full-page captures.

## Required portfolio captures

| File name                       | Route or action                                | What must be visible                                                                                     |
| ------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `01-catalogue-desktop.png`      | `index.html` on desktop                        | Rogontra logo, illustrative-catalogue notice, category filters, and mixed wholesale/industrial products. |
| `02-catalogue-mobile.png`       | `index.html` on mobile                         | Responsive header, catalogue heading, and product cards.                                                 |
| `03-heavy-equipment-search.png` | Search `excavator`                             | Industrial search result and the quote-only purchase path.                                               |
| `04-product-detail.png`         | Open a heavy-equipment product                 | Specifications, sales-assisted message, and quote action.                                                |
| `05-quote-request.png`          | Open the quote dialog                          | Synthetic data only; do not submit a real contact record.                                                |
| `06-checkout-review.png`        | Add a low-value demo product and open checkout | Server-priced order review, delivery form, and test-mode language.                                       |
| `07-account-dashboard.png`      | Sign in with a dedicated test account          | Procurement activity overview and safe empty or test history state.                                      |
| `08-admin-workspace.png`        | Sign in as a dedicated test administrator      | Pre-launch notice, labelled demo catalogue, and one operational desk.                                    |
| `09-architecture-or-api.png`    | Open `docs/architecture.md` or `docs/api.md`   | The owned full-stack architecture or documented API design.                                              |

Save captures beside this file using these names. The first four are the strongest choices for LinkedIn; include the admin or architecture view only if it is easy to understand at a glance.

## Capture notes

- Keep demo labels visible until real catalogue data and approved product imagery are available.
- Do not capture payment-provider screens, transaction references, database dashboards, `.env.local`, or admin credentials.
- Capturing an account, quote, checkout, or admin screen creates or displays test data. Use a dedicated test account and delete/rotate it through the normal application process before a commercial launch.
- After deployment, repeat the catalogue and product-detail captures using the HTTPS public URL, then use the deployed link in the LinkedIn post.
