const express = require('express');
const { 
  createReport, 
  getMyReports, 
  getAllReports, 
  approveReport, 
  addPRLFeedback 
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, authorize('lecturer', 'prl', 'pl', 'fmg'), createReport);
router.get('/my-reports', authenticate, authorize('lecturer', 'prl', 'pl', 'fmg'), getMyReports);
router.get('/all', authenticate, authorize('prl', 'pl', 'fmg', 'student'), getAllReports);
router.patch('/:reportId/approve', authenticate, authorize('student'), approveReport);
router.patch('/:reportId/feedback', authenticate, authorize('prl'), addPRLFeedback);

module.exports = router;