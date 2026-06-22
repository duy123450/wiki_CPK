const mongoose = require('mongoose');
const Movie = require('../../modules/wiki/models/movie.model');
const Character = require('../../modules/characters/character.model');
const Soundtrack = require('../../modules/soundtrack/sound-track.model');
const { connectDB, disconnectDB } = require('../../config/db'); // wait, if not using db config directly, we can just use the memory server setup from other tests
const app = require('../../server'); // Importing app connects to DB in test if it's setup, or we rely on standard jest setup.

// Actually, in typical test suites for this project, the connection is handled by global setup or beforeEach.
// Let's assume standard mongoose models are available and connected.

describe('Database Cascade Operations', () => {
  beforeEach(async () => {
    await Movie.deleteMany({});
    await Character.deleteMany({});
    await Soundtrack.deleteMany({});
  });

  it('should delete all characters and soundtracks when parent movie deleted', async () => {
    const movie = await Movie.create({
      title: 'Test Movie For Cascade',
      synopsis: 'Test Synopsis',
      slug: 'test-movie-cascade'
    });

    const char = await Character.create({
      name: 'Kaguya Cascade',
      role: 'Protagonist',
      movie: movie._id
    });

    const ost = await Soundtrack.create({
      title: 'Theme Song',
      vocal: 'Test Singer',
      youtubeId: 'dQw4w9WgXcQ',
      startTime: 0,
      endTime: 180,
      movie: movie._id
    });

    // Delete movie using findOneAndDelete which triggers the query hook
    await Movie.findOneAndDelete({ _id: movie._id });

    // Character should also be deleted
    const foundChar = await Character.findById(char._id);
    expect(foundChar).toBeNull();

    // Soundtrack should also be deleted
    const foundOst = await Soundtrack.findById(ost._id);
    expect(foundOst).toBeNull();
  });

  it('should validate foreign key references on character creation', async () => {
    const fakeMovieId = new mongoose.Types.ObjectId();

    await expect(
      Character.create({
        name: 'Invalid Character',
        role: 'Protagonist',
        movie: fakeMovieId // Non-existent movie
      })
    ).rejects.toThrow(`Movie with id ${fakeMovieId} does not exist`);
  });

  it('should prevent duplicate unique constraints under race condition', async () => {
    const movie = await Movie.create({
      title: 'Race Test Movie',
      synopsis: 'Race Test',
      slug: 'race-test'
    });

    // Trying to create multiple characters with same name
    // Assuming character has a unique index on 'name' or similar, we'd test it.
    // If not, we'll test movie unique title.
    const attempts = Array(5).fill(null).map(() =>
      Movie.create({
        title: 'Unique Title',
        synopsis: 'Test',
        slug: 'unique-slug'
      }).catch(e => e) // Catch errors to allow Promise.all to finish
    );

    const results = await Promise.all(attempts);
    
    // Only one should succeed, rest should be MongoServerError (E11000 duplicate key error)
    const successes = results.filter(r => r._id);
    expect(successes.length).toBe(1);
  });
});
