const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')
const envConfig = require('./env.config')

// 1. Cloudinary Config
cloudinary.config({
  cloud_name: envConfig.CLOUD_NAME,
  api_key: envConfig.API_KEY,
  api_secret: envConfig.API_SECRET,
})

// 2. Storage Engine Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wiki-cpk',
    allowed_formats: ['jpg', 'png', 'jpeg', 'jfif'],
  },
})

// 3. Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
})

module.exports = {
  cloudinary,
  upload,
}
