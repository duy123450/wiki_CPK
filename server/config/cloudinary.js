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

// 3. Initialize Multer with strict image filters
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jfif']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP and JFIF image files are allowed.'), false)
    }

    // Validate file extension to prevent double-extension or mismatched extensions
    const fileExtension = file.originalname.split('.').pop().toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif']
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file extension.'), false)
    }

    cb(null, true)
  }
})


module.exports = {
  cloudinary,
  upload,
}
