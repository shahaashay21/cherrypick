const express = require('express');
const router = express.Router();
const macys = require('../controllers/macys_controller');

router.get('/', macys.productInfo);

router.get('/products/:p', macys.getProducts);

module.exports = router;