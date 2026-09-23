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
    }
  };
}
