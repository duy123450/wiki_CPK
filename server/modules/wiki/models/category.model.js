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
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    }
}, { timestamps: true });

CategorySchema.pre('validate', function () {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

module.exports = mongoose.model('Category', CategorySchema);