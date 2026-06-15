const express = require('express');
const router = express.Router();
const { getLegalDocument } = require('./legal.controller');
const validateRequest = require('../../middleware/validateRequest');
const { getLegalDocumentSchema } = require('../../schemas/legal.schemas');
const { leakyBucketLimiter } = require('../../middleware/leakyBucket');
const redisClient = require('../../config/redis');

const legalLimiter = leakyBucketLimiter(redisClient, { capacity: 50, leakRate: 10 });

router.get('/:type', legalLimiter, validateRequest(getLegalDocumentSchema), getLegalDocument);

module.exports = router;

