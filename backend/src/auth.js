import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

function validateName(value) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
    throw clientError('INVALID_DISPLAY_NAME', 'Name must be between 2 and 100 characters.');
  }
  return value.trim();
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

function publicUser(user) {
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
}

export function createAuthService({ repository, secret }) {
  if (!secret || secret === 'replace-with-a-long-random-secret') {
    throw new Error('JWT_SECRET must be configured with a unique secret.');
  }

  function createToken(user) {
    return jwt.sign({ email: user.email }, secret, { subject: user.id, expiresIn: '8h' });
  }

  return {
    async register(input) {
      const email = validateEmail(input?.email);
      const displayName = validateName(input?.displayName);
      const passwordHash = await bcrypt.hash(validatePassword(input?.password), 12);

      try {
        const user = await repository.createUser({ email, displayName, passwordHash });
        return { token: createToken(user), user: publicUser(user) };
      } catch (error) {
        if (error.code === 'USER_EXISTS') {
          throw clientError('EMAIL_IN_USE', 'An account already exists for this email.', 409);
        }
        throw error;
      }
    },

    async login(input) {
      const email = validateEmail(input?.email);
      const password = validatePassword(input?.password);
      const user = await repository.findUserByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw clientError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
      }

      return { token: createToken(user), user: publicUser(user) };
    },

    verifyToken(token) {
      try {
        const claims = jwt.verify(token, secret);
        return { id: claims.sub, email: claims.email };
      } catch {
        throw clientError('INVALID_TOKEN', 'Your session is invalid or has expired.', 401);
      }
    },

    async verifyAdminToken(token) {
      const identity = this.verifyToken(token);
      const user = await repository.findUserById(identity.id);
      if (!user) {
        throw clientError('INVALID_TOKEN', 'Your session is invalid or has expired.', 401);
      }
      return publicUser(user);
    }
  };
}
