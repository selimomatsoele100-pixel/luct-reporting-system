const { query } = require('../config/db');

exports.createComplaint = async (req, res) => {
  try {
    const { complaint_against_id, complaint_text } = req.body;
    
    const [complainant, complaintAgainst] = await Promise.all([
      query('SELECT * FROM users WHERE id = $1', [req.user.userId]),
      query('SELECT * FROM users WHERE id = $1', [complaint_against_id])
    ]);

    if (!complaintAgainst.rows[0]) {
      return res.status(404).json({ error: 'User to complain against not found' });
    }

    // Determine complaint flow based on roles
    const complainantRole = complainant.rows[0].role;
    const againstRole = complaintAgainst.rows[0].role;

    // Validate complaint flow
    if (complainantRole === 'student' && againstRole !== 'lecturer') {
      return res.status(400).json({ error: 'Students can only complain against lecturers' });
    }
    if (complainantRole === 'lecturer' && againstRole !== 'prl') {
      return res.status(400).json({ error: 'Lecturers can only complain against PRL' });
    }
    if (complainantRole === 'prl' && againstRole !== 'pl') {
      return res.status(400).json({ error: 'PRL can only complain against PL' });
    }
    if (complainantRole === 'pl' && againstRole !== 'fmg') {
      return res.status(400).json({ error: 'PL can only complain against FMG' });
    }

    // Prevent self-complaint
    if (req.user.userId === parseInt(complaint_against_id)) {
      return res.status(400).json({ error: 'Cannot file complaint against yourself' });
    }

    const result = await query(
      `INSERT INTO complaints (
        complainant_id, complainant_name, complainant_role,
        complaint_against_id, complaint_against_name, complaint_against_role,
        complaint_text, faculty
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.userId,
        complainant.rows[0].name,
        complainant.rows[0].role,
        complaint_against_id,
        complaintAgainst.rows[0].name,
        complaintAgainst.rows[0].role,
        complaint_text,
        complainant.rows[0].faculty
      ]
    );

    res.status(201).json({
      message: 'Complaint filed successfully',
      complaint: result.rows[0]
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM complaints WHERE complainant_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getComplaintsAgainstMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM complaints WHERE complaint_against_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.respondToComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { response_text } = req.body;

    const result = await query(
      'UPDATE complaints SET response_text = $1, responded_by = $2, status = $3 WHERE id = $4 RETURNING *',
      [response_text, req.user.userId, 'reviewed', complaintId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({
      message: 'Response added successfully',
      complaint: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};