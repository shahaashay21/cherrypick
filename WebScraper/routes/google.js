const express = require('express');
const router = express.Router();
const google = require('../controllers/google_controller');

router.get('/products/:p', google.getProducts);

router.get('/redirect', google.redirectGoogleProduct);

module.exports = router;