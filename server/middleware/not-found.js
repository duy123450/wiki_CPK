const { NotFoundError } = require('../errors')

const notFound = (req, res, next) => {
    const error = new NotFoundError(`Route not found ${req.originalUrl}`)
    next(error)
}

module.exports = notFound