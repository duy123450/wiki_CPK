const express = require('express');
const router = express.Router();
const { getLegalDocument } = require('./legal.controller');

router.get('/:type', getLegalDocument);

module.exports = router;
