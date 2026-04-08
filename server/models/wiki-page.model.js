const mongoose = require('mongoose');

const WikiPageSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    content: { type: String, required: true }, // Rich text/Markdown
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'WikiPage must belong to a Category']
    },
    image: { url: String, public_id: String },
    heroVideo: {
        url: String,       // Cloudinary URL
        public_id: String, // For transformations
        isLooping: { type: Boolean, default: true }
    }
}, { timestamps: true });

// This "Middleware" runs before saving to turn "Princess Kaguya" into "princess-kaguya"
WikiPageSchema.pre('validate', function () {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special chars with hyphens
            .replace(/(^-|-$)/g, '');    // Remove leading/trailing hyphens
    }
});

module.exports = mongoose.model('WikiPage', WikiPageSchema);