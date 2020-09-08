const express = require('express');
const router = express.Router();
const feedback = require('../controllers/feedback_controller');

router.get('/test', feedback.updateTest);
router.get('/:email', feedback.getFeedback);

router.post('/', feedback.setFeedback);

module.exports = router;