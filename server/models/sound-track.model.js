const mongoose = require('mongoose');

const SoundtrackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Song title is required'],
        trim: true
    },
    artist: {
        type: String,
        required: [true, 'Artist name is required']
    },
    trackType: {
        type: String,
        enum: ['Opening', 'Ending', 'Insert Song', 'BGM', 'Full Album'],
        default: 'BGM'
    },
    // The unique ID from a Spotify URL
    spotifyId: {
        type: String,
        required: [true, 'Spotify Track/Album ID is required']
    },
    // Connects this soundtrack to your Movie model
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    // In case you want to display an infinite loop video while the music plays
    backgroundLoop: {
        url: String,
        public_id: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Soundtrack', SoundtrackSchema);