const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')

mongoose.plugin(slug)

const LyricSchema = new mongoose.Schema(
  {
    romaji: { type: String, default: '' }, // JP
    translation: { type: String, default: '' }, //  Vietnamese
    translator: { type: String, default: '' }, // Person who did the translation
    source: { type: String, default: '' }, // Translation source

    // Synced lines using Romaji as the primary line (in Romaji script)
    synced: [
      {
        time: { type: Number }, // Time in seconds from start of track
        line: { type: String }, // The lyric line in Romaji
        lineTranslation: { type: String, default: '' }, // The lyric line in Vietnamese
      },
    ],
  },
  { _id: false }
)

const SoundtrackSchema = new mongoose.Schema(
  {
    // Helps display the songs in the 1, 2, 3... order of the movie/video
    trackNumber: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      required: [true, 'Song title is required'],
      trim: true,
    },
    slug: {
      type: String,
      slug: 'title',
      unique: true,
    },
    vocal: {
      type: String,
      required: [true, 'Vocalist name is required'],
    },
    producer: {
      type: String,
      default: 'Unknown',
    },
    trackType: {
      type: String,
      // Using your specific vocal track categories
      enum: ['Opening', 'Insert Song', 'Ending'],
      default: 'Insert Song',
    },
    youtubeId: {
      type: String,
      required: [true, 'YouTube Video ID is required'],
    },
    officialUrl: [
      {
        label: {
          type: String,
          required: [true, 'Label is required'],
          trim: true,
        },
        url: {
          type: String,
          required: [true, 'URL is required'],
          trim: true,
        },
      },
    ],
    // START TIME: Where the song begins (in seconds)
    startTime: {
      type: Number,
      required: [true, 'Start time in seconds is required'],
      min: 0,
    },
    // END TIME: Where the song ends (in seconds)
    endTime: {
      type: Number,
      required: [true, 'End time in seconds is required'],
      validate: {
        validator: function (value) {
          return value > this.startTime
        },
        message: 'End time must be greater than start time',
      },
    },
    // Links this track to the specific Movie entry in your database
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    // High-quality cover art for the UI
    coverImage: {
      url: String,
      public_id: String,
    },
    lyrics: {
      type: LyricSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
)

// Indexes
SoundtrackSchema.index({ movie: 1, trackNumber: 1 })
SoundtrackSchema.index({ trackType: 1 })

SoundtrackSchema.virtual('embedUrl').get(function () {
  return `https://www.youtube.com/embed/${this.youtubeId}?start=${this.startTime}&end=${this.endTime}&autoplay=1`
})

SoundtrackSchema.pre('save', async function() {
  if (this.isModified('movie')) {
    const movieExists = await mongoose.model('Movie').exists({ _id: this.movie });
    if (!movieExists) {
      throw new Error(`Movie with id ${this.movie} does not exist`);
    }
  }
})

module.exports = mongoose.model('Soundtrack', SoundtrackSchema)
