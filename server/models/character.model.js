const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const CharacterSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },

    slug: { 
        type: String, 
        slug: "name",
        unique: true 
    },

    role: { 
        type: String, 
        enum: ['Protagonist', 'Supporting', 'Antagonist', 'Cameo'] 
    },

    description: {
        summary: String,
        personality: String,
        appearance: {
            realWorld: String,
            tsukuyomi: String
        }
    },

    origin: {
        location: String,
        birthday: String,
        race: String
    },

    abilities: [{
        skillName: String,
        type: { type: String, enum: ['Passive', 'Active', 'Ultimate', 'Debuff'] },
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

    relationships: [{
        targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
        relationType: String,
        description: String
    }],

    image: [{
        url: String,
        public_id: String
    }],

    voiceActor: String,

    movie: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie', 
        required: true 
    }
}, { timestamps: true });

// Indexes
CharacterSchema.index({ name: 'text', "description.summary": 'text' });
CharacterSchema.index({ role: 1 });
CharacterSchema.index({ movie: 1 });

module.exports = mongoose.model('Character', CharacterSchema);