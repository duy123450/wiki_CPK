const Category = require('../models/category.model');
const Movie = require('../models/movie.model');
const WikiPage = require('../models/wiki-page.model');
const asyncWrapper = require('../middleware/async');

// 1. Get all categories for the Sidebar
const getSidebar = asyncWrapper(async (req, res) => {
    const categories = await Category.find({}).sort('order');

    // For each category, fetch its wiki pages sorted by order
    const categoriesWithPages = await Promise.all(
        categories.map(async (category) => {
            const pages = await WikiPage.find({ category: category._id })
                .select('title slug order')
                .sort({ order: 1 });
            return {
                _id: category._id,
                name: category.name,
                icon: category.icon,
                slug: category.slug,
                pages: pages.map(p => ({ title: p.title, slug: p.slug }))
            };
        })
    );

    res.status(200).json({ categories: categoriesWithPages });
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