const cloudinary = require('cloudinary').v2
const {CloudinaryStorage} = require('multer-storage-cloudinary')
const multer = require('multer')
require('dotenv').config()

// 1. Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
})

// 2. Storage Engine Setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wiki-cpk',
        allowed_formats: ['jpg', 'png', 'jpeg', 'jfif']
    }
})

// 3. Initialize Multer
const upload = multer({ storage: storage })

module.exports = {
    cloudinary,
    upload
}