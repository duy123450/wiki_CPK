const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')

mongoose.plugin(slug)

const LoreSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['Technology', 'Location', 'Economy', 'Game System', 'Terminology'],
      required: true,
    },
    worldContext: {
      type: String,
      enum: ['Real World', 'Tsukuyomi', 'Universal'],
      required: true,
    },
    summary: String,
    content: String,
    details: [
      {
        key: String,
        value: String,
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

LoreSchema.index({ title: 'text', summary: 'text' })
LoreSchema.index({ category: 1 })

module.exports = mongoose.model('Lore', LoreSchema)
