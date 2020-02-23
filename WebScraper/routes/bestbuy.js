const express = require('express');
const router = express.Router();
const bestbuy = require('../controllers/bestbuy.controller');

router.get('/', bestbuy.productInfo);

router.get('/products/:p', bestbuy.getInfo);

module.exports = router;