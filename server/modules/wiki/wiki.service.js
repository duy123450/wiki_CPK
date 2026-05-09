const Category = require('./models/category.model');
const Movie = require('./models/movie.model');
const WikiPage = require('./models/wiki-page.model');
const { WikiError, ValidationError } = require('../../errors');
const asyncWrapper = require('../../middleware/async');

/**
 * Logic for the Hero section: Fetches the primary movie information.
 */
const fetchMovieData = async (title = "Chou Kaguya Hime") => {
    const movie = await Movie.findOne({ title });
    if (!movie) {
        throw new WikiError("Movie information not found", 404);
    }
    return movie;
};

/**
 * Aggregates all categories and their associated pages for the sidebar.
 */
const fetchSidebarData = async () => {
    const categories = await Category.find({}).sort('order');

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
                pages: pages.map(p => ({
                    title: p.title,
                    slug: p.slug
                }))
            };
        })
    );

    return categoriesWithPages;
};

/**
 * Retrieves a specific wiki page by its slug and populates its category details.
 */
const fetchPageBySlug = async (slug) => {
    if (!slug) {
        throw new ValidationError("Slug is required to fetch a page", 400);
    }

    const page = await WikiPage.findOne({ slug }).populate('category');

    if (!page) {
        throw new WikiError(`Wiki page not found: ${slug}`, 404);
    }

    return page;
};

// --- Controllers (Merged) ---

const getSidebar = asyncWrapper(async (req, res) => {
    const categories = await fetchSidebarData();
    res.status(200).json({ categories });
});

const getMovieInfo = asyncWrapper(async (req, res) => {
    const movie = await fetchMovieData("Chou Kaguya Hime");
    res.status(200).json({ movie });
});

const getPageBySlug = asyncWrapper(async (req, res) => {
    const page = await fetchPageBySlug(req.params.slug);
    res.status(200).json(page);
});

module.exports = {
    fetchMovieData,
    fetchSidebarData,
    fetchPageBySlug,
    getSidebar,
    getMovieInfo,
    getPageBySlug
};