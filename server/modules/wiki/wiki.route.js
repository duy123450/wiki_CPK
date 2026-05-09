const express = require('express');
const router = express.Router();
const {
    getSidebar,
    getMovieInfo,
    getPageBySlug
} = require('./wiki.service');

router.get('/sidebar', getSidebar);
router.get('/movie-info', getMovieInfo);
router.get('/page/:slug', getPageBySlug);

module.exports = router;