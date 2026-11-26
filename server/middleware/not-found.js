const { NotFoundError } = require('../errors')
const redactAdminMtdToken = require('../utils/redactAdminMtdToken')

const notFound = (req, res, next) => {
  const requestPath = redactAdminMtdToken(req.originalUrl)
  const error = new NotFoundError(`Route not found ${requestPath}`)
  next(error)
}

module.exports = notFound
