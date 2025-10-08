const { query } = require('../config/db');

class ClassAssignment {
  static async create(assignmentData) {
    const { class_id, lecturer_id, assigned_by } = assignmentData;

    const result = await query(
      `INSERT INTO class_assignments (class_id, lecturer_id, assigned_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [class_id, lecturer_id, assigned_by]
    );
    return result.rows[0];
  }

  static async findByLecturerId(lecturerId) {
    const result = await query(
      `SELECT ca.*, c.class_name, c.faculty 
       FROM class_assignments ca 
       JOIN classes c ON ca.class_id = c.id 
       WHERE ca.lecturer_id = $1`,
      [lecturerId]
    );
    return result.rows;
  }

  static async findByClassId(classId) {
    const result = await query(
      `SELECT ca.*, u.name as lecturer_name 
       FROM class_assignments ca 
       JOIN users u ON ca.lecturer_id = u.id 
       WHERE ca.class_id = $1`,
      [classId]
    );
    return result.rows;
  }

  static async deleteAssignment(classId, lecturerId) {
    const result = await query(
      'DELETE FROM class_assignments WHERE class_id = $1 AND lecturer_id = $2 RETURNING *',
      [classId, lecturerId]
    );
    return result.rows[0];
  }
}

module.exports = ClassAssignment;