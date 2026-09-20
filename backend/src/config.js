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
