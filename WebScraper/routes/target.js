const express = require('express');
const router = express.Router();
const target = require('../controllers/target_controller');

router.get('/', target.productInfo);

router.get('/products/:p', target.getProducts);

module.exports = router;