export function createDatabaseUserRepository(pool) {
  return {
    async createUser({ displayName, email, passwordHash }) {
      try {
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, display_name)
           VALUES ($1, $2, $3)
           RETURNING id, email, display_name, role`,
          [email, passwordHash, displayName]
        );
        const user = result.rows[0];
        return {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role
        };
      } catch (error) {
        if (error.code === '23505') {
          error.code = 'USER_EXISTS';
        }
        throw error;
      }
    },

    async findUserByEmail(email) {
      const result = await pool.query(
        'SELECT id, email, display_name, password_hash, role FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      return user
        ? {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            passwordHash: user.password_hash,
            role: user.role
          }
        : undefined;
    },

    async findUserById(userId) {
      const result = await pool.query(
        'SELECT id, email, display_name, role FROM users WHERE id = $1',
        [userId]
      );
      const user = result.rows[0];
      return user
        ? {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            role: user.role
          }
        : undefined;
    },

    async createPasswordResetToken({ userId, tokenHash, expiresAt }) {
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL', [
        userId
      ]);
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
      );
    },

    async consumePasswordResetToken({ tokenHash, passwordHash }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          `UPDATE password_reset_tokens
           SET used_at = NOW()
           WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
           RETURNING user_id`,
          [tokenHash]
        );
        if (!result.rows[0]) {
          await client.query('ROLLBACK');
          return false;
        }
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, result.rows[0].user_id]
        );
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  };
}
