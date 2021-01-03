const express = require('express');
const router = express.Router();
const compare = require('../controllers/compare_controller');

router.get('/:q', compare.compareProducts);

module.exports = router;