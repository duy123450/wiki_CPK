const mongoose = require('mongoose');

const WikiPageSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
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

module.exports = mongoose.model('WikiPage', WikiPageSchema);