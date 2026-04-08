const express = require('express');
const router = express.Router();
const {
    getSidebar,
    getMovieInfo,
    getPageBySlug
} = require('../controllers/wiki.controller');

router.get('/sidebar', getSidebar);
router.get('/movie-info', getMovieInfo);
router.get('/page/:slug', getPageBySlug);

module.exports = router;