const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5500';

export function getAllowedOrigins(value = process.env.CORS_ORIGIN) {
  return (value ?? DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getPort(value = process.env.PORT) {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function isHttpOrigin(value, { secureOnly = false } = {}) {
  try {
    const url = new URL(value);
    return (
      (secureOnly ? url.protocol === 'https:' : ['http:', 'https:'].includes(url.protocol)) &&
      url.origin === value
    );
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateProductionConfiguration(environment = process.env) {
  const issues = [];
  const databaseUrl = environment.DATABASE_URL;
  const jwtSecret = environment.JWT_SECRET;
  const origins = getAllowedOrigins(environment.CORS_ORIGIN);
  const paymentSecret = environment.PAYSTACK_SECRET_KEY;
  const paymentCallbackUrl = environment.PAYMENT_CALLBACK_URL;

  try {
    const url = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      issues.push('DATABASE_URL must use the postgres or postgresql protocol.');
    }
  } catch {
    issues.push('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (
    typeof jwtSecret !== 'string' ||
    jwtSecret.length < 32 ||
    jwtSecret === 'replace-with-a-long-random-secret'
  ) {
    issues.push('JWT_SECRET must be a unique value with at least 32 characters.');
  }

  if (
    origins.length === 0 ||
    !origins.every((origin) => isHttpOrigin(origin, { secureOnly: true }))
  ) {
    issues.push('CORS_ORIGIN must contain one or more exact HTTPS storefront origins.');
  }

  if (Boolean(paymentSecret) !== Boolean(paymentCallbackUrl)) {
    issues.push('PAYSTACK_SECRET_KEY and PAYMENT_CALLBACK_URL must be configured together.');
  }

  if (paymentCallbackUrl && !isHttpsUrl(paymentCallbackUrl)) {
    issues.push('PAYMENT_CALLBACK_URL must be an HTTPS URL.');
  }

  return issues;
}
