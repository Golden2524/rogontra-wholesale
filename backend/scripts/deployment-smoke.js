import { runDeploymentSmokeCheck } from '../src/deployment-smoke.js';

try {
  const result = await runDeploymentSmokeCheck({
    apiBaseUrl: process.env.ROGONTRA_API_BASE_URL,
    storefrontUrl: process.env.ROGONTRA_STOREFRONT_URL
  });
  console.info(`Deployment smoke check passed for ${result.storefront} and ${result.api}.`);
  console.info(
    `Verified ${result.catalogueItems} catalogue items across ${result.categories} categories.`
  );
} catch (error) {
  console.error(
    `Deployment smoke check failed: ${error instanceof Error ? error.message : 'Unknown error.'}`
  );
  process.exitCode = 1;
}
