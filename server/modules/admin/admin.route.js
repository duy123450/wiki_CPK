const express = require('express')
const router = express.Router()
const operationsRouter = express.Router()

const authenticateUser = require('../../middleware/authentication')
const { authorizeRoles, ROLES } = require('../../middleware/authorizeRoles')
const { invalidateCache } = require('../../middleware/cache')
const { MTD_ENABLED } = require('../adminPerimeter/adminPerimeter')
const { checkDynamicRoute } = require('../adminPerimeter/adminPerimeter.middleware')

operationsRouter.post(
  '/soundtrack/cache/clear',
  invalidateCache('soundtracks'),
  (_req, res) => {
    res.status(200).json({ message: 'Soundtrack cache cleared' })
  }
)

router.use(authenticateUser, authorizeRoles(ROLES.ADMIN))

if (MTD_ENABLED) {
  router.use('/:token', (req, res, next) => {
    if (
      req.params.token === 'soundtrack' &&
      req.path.replace(/\/+$/, '') === '/cache/clear'
    ) {
      return res.status(403).json({ message: 'MTD token required' })
    }

    return checkDynamicRoute(req, res, next)
  })
  // Keep the MTD gate ahead of Admin handlers so routes added below it
  // cannot accidentally omit the token check.
  router.use('/:token', operationsRouter)
} else {
  router.use(operationsRouter)
}

module.exports = router
