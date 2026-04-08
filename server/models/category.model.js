const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    icon: {
        type: String, // e.g., "user", "music", "video" (for Lucide-react icons)
        default: 'file-text'
    },
    order: {
        type: Number,
        default: 0 // Helps you sort which category appears first
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);