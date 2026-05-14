const { CustomAPIError } = require('../errors')

const errorHandlerMiddleware = (err, req, res, next) => {
    // 1. Set default values for generic server errors
    let customError = {
        statusCode: err.statusCode || 500,
        msg: err.message || 'Something went wrong, please try again later',
    };

    // 2. Domain-Specific Errors (CustomAPIError or any error with a statusCode)
    if (err instanceof CustomAPIError || err.statusCode) {
        return res.status(err.statusCode || 400).json({ 
            msg: err.message,
            errorType: err.constructor.name 
        })
    }

    // 3. Mongoose: Handling Duplicate Key Error (e.g., Code: 11000)
    if (err.code && err.code === 11000) {
        customError.msg = `Duplicate value entered for ${Object.keys(
            err.keyValue
        )} field, please choose another value`
        customError.statusCode = 400
    }

    // 4. Mongoose: Handling Validation Errors (e.g., required field missing)
    if (err.name === 'ValidationError' && err.errors) {
        customError.msg = Object.values(err.errors).map((item) => item.message).join(', ')
        customError.statusCode = 400
    }

    // 5. Mongoose: Handling "CastError" (e.g., invalid ObjectId format)
    if (err.name === 'CastError') {
        customError.msg = `No item found with id: ${err.value}`
        customError.statusCode = 404
    }

    // 6. Mongoose: Connection/Timeout Errors
    if (err.message && err.message.includes('buffered query timed out')) {
        customError.msg = 'Database connection timed out. Please try again'
        customError.statusCode = 503
    }

    // 7. Send the final response
    return res.status(customError.statusCode).json({ msg: customError.msg })
}

module.exports = errorHandlerMiddleware