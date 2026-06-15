const express = require('express')
const router = express.Router()
const { getSidebar, getMovieInfo, getPageBySlug } = require('./wiki.controller')
const { leakyBucketLimiter } = require('../../middleware/leakyBucket')
const redisClient = require('../../config/redis')

const wikiSearchLimiter = leakyBucketLimiter(redisClient, { capacity: 50, leakRate: 10 })

router.get('/sidebar', getSidebar)
router.get('/movie-info', wikiSearchLimiter, getMovieInfo)
router.get('/page/:slug', wikiSearchLimiter, getPageBySlug)

module.exports = router
