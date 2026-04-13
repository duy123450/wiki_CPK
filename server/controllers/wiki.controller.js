const Category = require('../models/category.model');
const Movie = require('../models/movie.model');
const WikiPage = require('../models/wiki-page.model');
const asyncWrapper = require('../middleware/async');

// 1. Get all categories for the Sidebar
const getSidebar = asyncWrapper(async (req, res) => {
    const categories = await Category.find({}).sort('order');
    res.status(200).json({ categories });
});

// 2. Get the single movie data (The Hero Loop)
const getMovieInfo = asyncWrapper(async (req, res) => {
    const movie = await Movie.findOne({ title: "Chou Kaguya Hime" });
    res.status(200).json({ movie });
});

// 3. Get a specific Wiki Page by its slug (e.g., /lore/lunar-history)
const getPageBySlug = asyncWrapper(async (req, res) => {
    const { slug } = req.params;
    const page = await WikiPage.findOne({ slug }).populate('category');
    if (!page) return res.status(404).json({ msg: "Page not found" });
    res.status(200).json(page);
});

module.exports = { getSidebar, getMovieInfo, getPageBySlug };