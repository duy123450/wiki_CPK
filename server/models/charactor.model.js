const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['Protagonist', 'Supporting', 'Antagonist', 'Cameo'] },
    description: String,
    image: {
        url: String,
        public_id: String
    },
    voiceActor: String, // Seiyuu
    // Infinite loop specific to this character
    actionClip: {
        url: String,
        public_id: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Character', CharacterSchema);