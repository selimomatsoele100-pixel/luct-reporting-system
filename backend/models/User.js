const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, role, faculty, class_id, program } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Convert empty class_id to null
    const processedClassId = (class_id === '' || class_id === null || class_id === undefined) ? null : parseInt(class_id);
    
    const result = await query(
      `INSERT INTO users (name, email, password, role, faculty, class_id, program) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, faculty, class_id, program, created_at`,
      [name, email, hashedPassword, role, faculty, processedClassId, program]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, role, faculty, class_id, program, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async getAllUsers() {
    const result = await query(
      'SELECT id, name, email, role, faculty, class_id, program, created_at FROM users ORDER BY name'
    );
    return result.rows;
  }

  static async getUsersByRole(role) {
    const result = await query(
      'SELECT id, name, email, role, faculty, class_id, program FROM users WHERE role = $1 ORDER BY name',
      [role]
    );
    return result.rows;
  }

  static async updateUser(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      // Handle class_id conversion
      if (key === 'class_id') {
        const processedValue = (value === '' || value === null || value === undefined) ? null : parseInt(value);
        fields.push(`${key} = $${paramCount}`);
        values.push(processedValue);
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }

    values.push(id);
    const queryText = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;