const express = require('express');
const router = express.Router();
const account = require('../controllers/account_controller');

router.post('/getid', account.getUid);

module.exports = router;