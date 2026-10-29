import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const PASSWORD_MINIMUM_LENGTH = 12;

function clientError(code, message, statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function validateEmail(value) {
  if (typeof value !== 'string' || !/^\S+@\S+\.\S+$/.test(value)) {
    throw clientError('INVALID_EMAIL', 'Enter a valid email address.');
  }
  return value.trim().toLowerCase();
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < PASSWORD_MINIMUM_LENGTH || value.length > 128) {
    throw clientError(
      'INVALID_PASSWORD',
      `Password must be between ${PASSWORD_MINIMUM_LENGTH} and 128 characters.`
    );
  }
  return value;
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(baseUrl, token) {
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export function createPasswordResetService({ repository, sendResetEmail, resetUrl }) {
  if (!repository) throw new Error('Password reset repository is required.');

  return {
    isDeliveryConfigured: Boolean(sendResetEmail && resetUrl),
    async request(input) {
      const email = validateEmail(input?.email);
      const user = await repository.findUserByEmail(email);

      // Keep this request indistinguishable for registered and unknown addresses.
      if (!user) return;

      const token = randomBytes(RESET_TOKEN_BYTES).toString('base64url');
      await repository.createPasswordResetToken({
        userId: user.id,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
      });
      await sendResetEmail({ email: user.email, resetUrl: buildResetUrl(resetUrl, token) });
    },

    async reset(input) {
      if (typeof input?.token !== 'string' || input.token.length < 40 || input.token.length > 200) {
        throw clientError(
          'INVALID_RESET_TOKEN',
          'This password-reset link is invalid or has expired.'
        );
      }

      const passwordHash = await bcrypt.hash(validatePassword(input.password), 12);
      const wasReset = await repository.consumePasswordResetToken({
        tokenHash: tokenHash(input.token),
        passwordHash
      });
      if (!wasReset) {
        throw clientError(
          'INVALID_RESET_TOKEN',
          'This password-reset link is invalid or has expired.'
        );
      }
    }
  };
}
