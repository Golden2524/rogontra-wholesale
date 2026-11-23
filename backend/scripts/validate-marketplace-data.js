import { readFile } from 'node:fs/promises';

import { validateMarketplaceData } from '../src/marketplace-preflight.js';

const [cataloguePath, fulfilmentPath] = process.argv.slice(2);

if (!cataloguePath || !fulfilmentPath) {
  console.error(
    'Usage: npm run marketplace:validate -- path/to/catalogue.csv path/to/fulfilment.csv'
  );
  process.exitCode = 1;
} else {
  try {
    const [catalogue, fulfilment] = await Promise.all([
      readFile(cataloguePath, 'utf8'),
      readFile(fulfilmentPath, 'utf8')
    ]);
    const result = validateMarketplaceData(catalogue, fulfilment);
    if (result.errors.length) {
      console.error(`Marketplace data check found ${result.errors.length} issue(s):`);
      result.errors.forEach((error) => console.error(`- ${error}`));
      process.exitCode = 1;
    } else {
      console.info(
        `Marketplace data is ready for review: ${result.approvedProducts} approved product(s).`
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unable to validate marketplace data.');
    process.exitCode = 1;
  }
}
