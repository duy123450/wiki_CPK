const { CustomAPIError } = require('../errors')

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || 500,
    msg: err.message || 'Something went wrong, please try again later',
  }

  // 1. Mongoose: Duplicate Key Error (code 11000) — check before CustomAPIError
  //    so a duplicate-key inside a custom wrapper doesn't hit the early return below
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`
    customError.statusCode = 400
  }

  // 2. Mongoose: Validation Error (required field missing)
  if (err.name === 'ValidationError' && err.errors) {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ')
    customError.statusCode = 400
  }

  // 3. Mongoose: CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    customError.msg = `No item found with id: ${err.value}`
    customError.statusCode = 404
  }

  // 4. Mongoose: Connection/Timeout Errors
  if (err.message && err.message.includes('buffered query timed out')) {
    customError.msg = 'Database connection timed out. Please try again'
    customError.statusCode = 503
  }

  // 5. Domain-Specific CustomAPIError — only after Mongoose checks are done
  if (err instanceof CustomAPIError || (err.statusCode && !err.code && err.name !== 'ValidationError' && err.name !== 'CastError')) {
    return res.status(err.statusCode || 400).json({
      msg: err.message,
      errorType: err.constructor.name,
    })
  }

  // 6. Final fallback
  return res.status(customError.statusCode).json({ msg: customError.msg })
}

module.exports = errorHandlerMiddleware
