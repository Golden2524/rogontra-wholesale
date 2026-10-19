import { validateProductionConfiguration } from '../src/config.js';

const issues = validateProductionConfiguration();

if (issues.length > 0) {
  console.error('Deployment configuration check failed:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.info('Deployment configuration check passed.');
}
