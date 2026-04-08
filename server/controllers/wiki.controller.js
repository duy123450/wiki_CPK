const Category = require('../models/category.model');
const Movie = require('../models/movie.model');
const WikiPage = require('../models/wiki-page.model');

// 1. Get all categories for the Sidebar
const getSidebar = async (req, res) => {
    try {
        const categories = await Category.find({}).sort('order');
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// 2. Get the single movie data (The Hero Loop)
const getMovieInfo = async (req, res) => {
    try {
        const movie = await Movie.findOne({ title: "Chou Kaguya Hime" });
        res.status(200).json({ movie });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// 3. Get a specific Wiki Page by its slug (e.g., /lore/lunar-history)
const getPageBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = await WikiPage.findOne({ slug }).populate('category');
        if (!page) return res.status(404).json({ msg: "Page not found" });
        res.status(200).json(page);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

module.exports = { getSidebar, getMovieInfo, getPageBySlug };