const mongoose = require('mongoose');
require('dotenv')

const connectDB = (url) => {
    return mongoose.connect(url)
}

module.exports = connectDB