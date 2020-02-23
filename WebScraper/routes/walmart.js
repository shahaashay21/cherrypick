const express = require('express');
const router = express.Router();
const walmart = require('../controllers/walmart_controller');

router.get('/', walmart.productInfo);

router.get('/products/:p', walmart.getInfo);

module.exports = router;