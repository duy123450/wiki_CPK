const express = require('express');
const router = express.Router();
const characterService = require('../services/character.service');
const asyncWrapper = require('../middleware/async');

router.get('/', asyncWrapper(async (req, res) => {
    const result = await characterService.fetchAllCharacters(req.query);
    res.status(200).json(result);
}));

router.get('/:slug', asyncWrapper(async (req, res) => {
    const character = await characterService.fetchCharacterBySlug(req.params.slug);
    res.status(200).json({ character });
}));

module.exports = router;
