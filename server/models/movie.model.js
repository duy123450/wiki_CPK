const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Movie title is required'],
        unique: true,
        trim: true
    },
    tagline: {
        type: String,
        trim: true // e.g., "A tale of the moon and a heart's desire"
    },
    synopsis: {
        type: String,
        required: [true, 'Synopsis is required']
    },
    // --- THE INFINITE LOOP SECTION ---
    heroVideo: [{
        url: String,       // Cloudinary URL for the big background loop
        public_id: String,
        isLooping: { type: Boolean, default: true }
    }],
    poster: [{
        url: String,       // The main movie poster (Cloudinary)
        public_id: String
    }],
    // --- PRODUCTION DATA ---
    details: {
        releaseDate: Date,
        runtime: String,    // e.g., "120 min"
        studio: String,     // e.g., "A-1 Pictures"
        director: String,
        officialWebsite: String,
        watchUrl: {
            type: String,
            trim: true
        },
        lightNovelUrl: {
            type: String,
            trim: true
        }
    },
    // --- STATS ---
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    slug: {
        type: String,
        lowercase: true,
        unique: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals to automatically grab related data without storing it twice
MovieSchema.virtual('characters', {
    ref: 'Character',
    localField: '_id',
    foreignField: 'movie'
});

MovieSchema.virtual('soundtracks', {
    ref: 'Soundtrack',
    localField: '_id',
    foreignField: 'movie'
});

module.exports = mongoose.model('Movie', MovieSchema);