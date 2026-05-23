const express = require('express')
const router = express.Router()

const {
  getAllCharacters,
  getCharacterBySlug,
} = require('./character.controller')
const validateRequest = require('../../middleware/validateRequest')
const { characterQuerySchema } = require('../../schemas/character.schemas')
const { cacheData, invalidateCache } = require('../../middleware/cache')

// GET /api/v1/wiki/characters
router.get('/', validateRequest(characterQuerySchema), cacheData('characters', 3600), getAllCharacters)

// GET /api/v1/wiki/characters/:slug
// e.g. /api/v1/wiki/characters/kaguya
router.get('/:slug', cacheData('characters', 3600), getCharacterBySlug)

// Example POST route to demonstrate cache invalidation
router.post('/', invalidateCache('characters'), (req, res) => {
  // In a real scenario, this would be a controller that creates a character
  res.status(201).json({ msg: 'Character created and cache invalidated.' })
})

module.exports = router
