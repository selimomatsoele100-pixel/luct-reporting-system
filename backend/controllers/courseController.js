const { query } = require('../config/db');

exports.getCourses = async (req, res) => {
  try {
    let queryText = 'SELECT * FROM courses';
    let params = [];

    if (req.user.role === 'prl') {
      queryText += ' WHERE faculty = $1';
      params = [req.user.faculty];
    }

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.assignCourse = async (req, res) => {
  try {
    const { courseId, lecturerId } = req.body;

    const result = await query(
      'UPDATE courses SET assigned_lecturer_id = $1 WHERE id = $2 RETURNING *',
      [lecturerId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      message: 'Course assigned successfully',
      course: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.assignClass = async (req, res) => {
  try {
    const { classId, lecturerId } = req.body;

    // Check if assignment already exists
    const existing = await query(
      'SELECT * FROM class_assignments WHERE class_id = $1 AND lecturer_id = $2',
      [classId, lecturerId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Class already assigned to this lecturer' });
    }

    const result = await query(
      'INSERT INTO class_assignments (class_id, lecturer_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
      [classId, lecturerId, req.user.userId]
    );

    // Also update the classes table
    await query(
      'UPDATE classes SET assigned_lecturer_id = $1 WHERE id = $2',
      [lecturerId, classId]
    );

    res.status(201).json({
      message: 'Class assigned successfully',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('Assign class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getClasses = async (req, res) => {
  try {
    const result = await query('SELECT * FROM classes ORDER BY class_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};