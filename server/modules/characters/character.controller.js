const characterService = require('./character.service');
const asyncWrapper = require('../../middleware/async');

const getAllCharacters = asyncWrapper(async (req, res) => {
    const result = await characterService.fetchAllCharacters(req.query);
    res.status(200).json(result);
});

const getCharacterBySlug = asyncWrapper(async (req, res) => {
    const character = await characterService.fetchCharacterBySlug(req.params.slug);
    res.status(200).json({ character });
});

module.exports = { getAllCharacters, getCharacterBySlug }; 