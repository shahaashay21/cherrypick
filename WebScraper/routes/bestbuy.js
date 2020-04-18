const express = require('express');
const router = express.Router();
const bestbuy = require('../controllers/bestbuy_controller');

router.get('/', bestbuy.productInfo);

router.get('/products/:p', bestbuy.getProducts);

module.exports = router;