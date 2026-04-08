const { CustomAPIError } = require('../errors/custom-error')

const notFound = (req, res, next) => {
    const error = new CustomAPIError(`Route not found ${req.originalUrl}`, 404)
    next(error)
}

module.exports = notFound