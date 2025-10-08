const express = require('express');
const {
  getCourses,
  assignCourse,
  assignClass,
  getClasses
} = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, getCourses);
router.get('/classes', authenticate, getClasses);
router.post('/assign-course', authenticate, authorize('pl'), assignCourse);
router.post('/assign-class', authenticate, authorize('pl'), assignClass);

module.exports = router;