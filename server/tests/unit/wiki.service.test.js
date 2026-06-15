const Category = require('../../modules/wiki/models/category.model');
const Movie = require('../../modules/wiki/models/movie.model');
const WikiPage = require('../../modules/wiki/models/wiki-page.model');
const Soundtrack = require('../../modules/soundtrack/sound-track.model');
const { fetchMovieData, fetchSidebarData, fetchPageBySlug } = require('../../modules/wiki/wiki.service');
const { WikiError, ValidationError } = require('../../errors');

jest.mock('../../modules/wiki/models/category.model');
jest.mock('../../modules/wiki/models/movie.model');
jest.mock('../../modules/wiki/models/wiki-page.model');
jest.mock('../../modules/soundtrack/sound-track.model');

describe('Wiki Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMovieData', () => {
    it('should return movie if found', async () => {
      const mockMovie = { title: 'Test Movie' };
      Movie.findOne.mockResolvedValue(mockMovie);

      const result = await fetchMovieData('Test Movie');
      
      expect(Movie.findOne).toHaveBeenCalledWith({ title: 'Test Movie' });
      expect(result).toEqual(mockMovie);
    });

    it('should throw WikiError if not found', async () => {
      Movie.findOne.mockResolvedValue(null);

      await expect(fetchMovieData('Test Movie')).rejects.toThrow(WikiError);
    });
  });

  describe('fetchPageBySlug', () => {
    it('should return page with populated category', async () => {
      const mockPage = { title: 'Test Page' };
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockPage)
      };
      WikiPage.findOne.mockReturnValue(mockQuery);

      const result = await fetchPageBySlug('test-slug');

      expect(WikiPage.findOne).toHaveBeenCalledWith({ slug: 'test-slug' });
      expect(mockQuery.populate).toHaveBeenCalledWith('category');
      expect(result).toEqual(mockPage);
    });

    it('should throw ValidationError if no slug', async () => {
      await expect(fetchPageBySlug()).rejects.toThrow(ValidationError);
    });

    it('should throw WikiError if page not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };
      WikiPage.findOne.mockReturnValue(mockQuery);

      await expect(fetchPageBySlug('test-slug')).rejects.toThrow(WikiError);
    });
  });

  describe('fetchSidebarData', () => {
    it('should aggregate categories and pages correctly', async () => {
      const mockCategories = [
        { _id: '1', name: 'Characters', slug: 'characters', icon: 'user' },
        { _id: '2', name: 'Soundtrack', slug: 'soundtrack', icon: 'music' }
      ];

      const mockQuery = { sort: jest.fn().mockResolvedValue(mockCategories) };
      Category.find.mockReturnValue(mockQuery);

      // Mock WikiPage find
      const mockWikiPages = [{ title: 'Char 1', slug: 'char-1' }];
      const mockWikiPageQuery = { 
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockWikiPages)
      };
      WikiPage.find.mockReturnValue(mockWikiPageQuery);

      // Mock Soundtrack find
      const mockTracks = [{ title: 'Track 1', slug: 'track-1' }];
      const mockTrackQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTracks)
      };
      Soundtrack.find.mockReturnValue(mockTrackQuery);

      const result = await fetchSidebarData();

      expect(Category.find).toHaveBeenCalledWith({});
      expect(mockQuery.sort).toHaveBeenCalledWith('order');
      
      expect(WikiPage.find).toHaveBeenCalledWith({ category: '1' });
      expect(Soundtrack.find).toHaveBeenCalledWith({
        $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
      });

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('characters');
      expect(result[0].pages).toHaveLength(1);
      expect(result[0].pages[0].title).toBe('Char 1');

      expect(result[1].slug).toBe('soundtrack');
      expect(result[1].pages).toHaveLength(1);
      expect(result[1].pages[0].title).toBe('Track 1');
    });
  });
});
