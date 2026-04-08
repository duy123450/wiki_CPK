class CustomAPIError extends Error {
    constructor(msg, statusCode) {
        super(msg)
        this.statusCode = statusCode
    }
}

const createCustomError = (msg, statusCode) => {
    return new CustomAPIError(msg, statusCode)
}

module.exports = {
    CustomAPIError,
    createCustomError
}