const express = require('express');
const router = express.Router();

const { getAllCharacters, getCharacterBySlug } = require('../controllers/character.controller');

// GET /api/v1/wiki/characters
router.get('/', getAllCharacters);

// GET /api/v1/wiki/characters/:slug
// e.g. /api/v1/wiki/characters/kaguya
router.get('/:slug', getCharacterBySlug);

module.exports = router;