const mongoose = require('mongoose');

const SoundtrackSchema = new mongoose.Schema({
    // Helps display the songs in the 1, 2, 3... order of the movie/video
    trackNumber: {
        type: Number,
        default: 0
    },
    title: {
        type: String,
        required: [true, 'Song title is required'],
        trim: true
    },
    vocal: {
        type: String,
        required: [true, 'Vocalist name is required']
    },
    producer: {
        type: String,
        default: "Unknown"
    },
    trackType: {
        type: String,
        // Using your specific vocal track categories
        enum: ['Opening', 'Ending', 'Insert Song', 'BGM', 'Full Album'],
        default: 'Insert Song'
    },
    youtubeId: {
        type: String,
        required: [true, 'YouTube Video ID is required']
    },
    // START TIME: Where the song begins (in seconds)
    startTime: {
        type: Number,
        required: [true, 'Start time in seconds is required'],
        min: 0
    },
    // END TIME: Where the song ends (in seconds)
    endTime: {
        type: Number,
        required: [true, 'End time in seconds is required'],
        validate: {
            validator: function(value) {
                return value > this.startTime;
            },
            message: 'End time must be greater than start time'
        }
    },
    // Links this track to the specific Movie entry in your database
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    // High-quality cover art for the UI
    coverImage: {
        url: String,
        public_id: String
    }
}, { timestamps: true });

// Indexes
SoundtrackSchema.index({ movie: 1, trackNumber: 1 });
SoundtrackSchema.index({ trackType: 1 });

SoundtrackSchema.virtual('embedUrl').get(function() {
    return `https://www.youtube.com/embed/${this.youtubeId}?start=${this.startTime}&end=${this.endTime}&autoplay=1`;
});

module.exports = mongoose.model('Soundtrack', SoundtrackSchema);