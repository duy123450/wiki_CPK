const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['Protagonist', 'Supporting', 'Antagonist', 'Cameo'] },
    
    description: {
        summary: String,
        personality: String,
        appearance: String
    },

    origin: {
        location: String,
        birthday: String,
        race: String
    },

    abilities: [{
        skillName: String,
        type: { type: String, enum: ['Passive', 'Active', 'Ultimate'] },
        effect: [String]
    }],

    metadata: {
        alias: String,
        family: {
            mother: String,
            father: String,
            brother: String,
            sister: String
        },
        occupation: String
    },

    image: [{
        url: String,
        public_id: String
    }],
    voiceActor: String,

}, { timestamps: true });

module.exports = mongoose.model('Character', CharacterSchema);