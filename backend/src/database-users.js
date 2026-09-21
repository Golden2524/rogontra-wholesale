export function createDatabaseUserRepository(pool) {
  return {
    async createUser({ displayName, email, passwordHash }) {
      try {
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, display_name)
           VALUES ($1, $2, $3)
           RETURNING id, email, display_name`,
          [email, passwordHash, displayName]
        );
        const user = result.rows[0];
        return { id: user.id, email: user.email, displayName: user.display_name };
      } catch (error) {
        if (error.code === '23505') {
          error.code = 'USER_EXISTS';
        }
        throw error;
      }
    },

    async findUserByEmail(email) {
      const result = await pool.query(
        'SELECT id, email, display_name, password_hash FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      return user
        ? {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            passwordHash: user.password_hash
          }
        : undefined;
    }
  };
}
