const express = require('express');
const {
  createComplaint,
  getMyComplaints,
  getComplaintsAgainstMe,
  respondToComplaint
} = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, createComplaint);
router.get('/my-complaints', authenticate, getMyComplaints);
router.get('/against-me', authenticate, getComplaintsAgainstMe);
router.patch('/:complaintId/respond', authenticate, respondToComplaint);

module.exports = router;