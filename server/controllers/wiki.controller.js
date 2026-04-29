const wikiService = require('../services/wiki.service');
const asyncWrapper = require('../middleware/async');

const getSidebar = asyncWrapper(async (req, res) => {
    const categories = await wikiService.fetchSidebarData();
    res.status(200).json({ categories });
});

const getMovieInfo = asyncWrapper(async (req, res) => {
    const movie = await wikiService.fetchMovieData("Chou Kaguya Hime");
    res.status(200).json({ movie });
});

const getPageBySlug = asyncWrapper(async (req, res) => {
    const page = await wikiService.fetchPageBySlug(req.params.slug);
    res.status(200).json(page);
});

module.exports = { getSidebar, getMovieInfo, getPageBySlug };