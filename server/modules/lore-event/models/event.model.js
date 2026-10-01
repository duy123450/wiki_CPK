const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')

mongoose.plugin(slug)

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      slug: 'title',
      unique: true,
    },
    duration: String,
    objective: String,
    rules: [String],
    summary: String,
    content: String,
    participants: [
      {
        characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
        status: {
          type: String,
          enum: ['Contender', 'Favorite', 'Organizer', 'Winner'],
        },
      },
    ],
    image: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  { timestamps: true }
)

EventSchema.index({ title: 'text' })

module.exports = mongoose.model('Event', EventSchema)
