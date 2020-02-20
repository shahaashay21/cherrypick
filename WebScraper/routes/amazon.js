const express = require('express');
const router = express.Router();
const amazon = require('../controllers/amazon_controller');

router.get('/', amazon.productInfo);

router.get('/products/:p', amazon.getInfo);

module.exports = router;