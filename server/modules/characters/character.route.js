const express = require('express');
const router = express.Router();

const { getAllCharacters, getCharacterBySlug } = require('./character.controller');
const validateRequest = require('../../middleware/validateRequest');
const { characterQuerySchema } = require('../../schemas/character.schemas');

// GET /api/v1/wiki/characters
router.get('/', validateRequest(characterQuerySchema), getAllCharacters);

// GET /api/v1/wiki/characters/:slug
// e.g. /api/v1/wiki/characters/kaguya
router.get('/:slug', getCharacterBySlug);

module.exports = router;