const { query } = require('../config/db');

exports.createReport = async (req, res) => {
  try {
    const {
      faculty, class_name, week_of_reporting, date_of_lecture, course_name,
      course_code, students_present, total_students, venue, scheduled_time,
      topic_taught, learning_outcomes, recommendations
    } = req.body;

    const user = await query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const lecturer = user.rows[0];

    const result = await query(
      `INSERT INTO reports (
        faculty, class_name, week_of_lecture, date_of_lecture, course_name,
        course_code, lecturer_id, lecturer_name, students_present, total_students,
        venue, scheduled_time, topic_taught, learning_outcomes, recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        faculty, class_name, week_of_reporting, date_of_lecture, course_name,
        course_code, lecturer.id, lecturer.name, students_present, total_students,
        venue, scheduled_time, topic_taught, learning_outcomes, recommendations
      ]
    );

    res.status(201).json({
      message: 'Report created successfully',
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM reports WHERE lecturer_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    let queryText = 'SELECT * FROM reports';
    let params = [];

    if (req.user.role === 'prl') {
      queryText += ' WHERE faculty = $1';
      params = [req.user.faculty];
    }

    queryText += ' ORDER BY created_at DESC';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.approveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { signature } = req.body;

    const result = await query(
      'UPDATE reports SET student_approved = true, student_signature = $1, status = $2 WHERE id = $3 RETURNING *',
      [signature, 'student_approved', reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Report approved successfully',
      report: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addPRLFeedback = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback } = req.body;

    const result = await query(
      'UPDATE reports SET prl_feedback = $1, status = $2 WHERE id = $3 RETURNING *',
      [feedback, 'prl_approved', reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Feedback added successfully',
      report: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};