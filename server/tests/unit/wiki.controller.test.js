const { fetchSidebarData, fetchMovieData, fetchPageBySlug } = require('../../modules/wiki/wiki.service');
const { getSidebar, getMovieInfo, getPageBySlug } = require('../../modules/wiki/wiki.controller');
const { createMocks, createMocksWithParams } = require('../utils/mockFactory');

jest.mock('../../modules/wiki/wiki.service');

describe('Wiki Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSidebar', () => {
    it('should return categories', async () => {
      const mockCategories = [{ name: 'Test' }];
      fetchSidebarData.mockResolvedValue(mockCategories);
      const { req, res } = createMocks();

      await getSidebar(req, res);

      expect(fetchSidebarData).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ categories: mockCategories });
    });
  });

  describe('getMovieInfo', () => {
    it('should return movie info', async () => {
      const mockMovie = { title: 'Movie' };
      fetchMovieData.mockResolvedValue(mockMovie);
      const { req, res } = createMocks();

      await getMovieInfo(req, res);

      expect(fetchMovieData).toHaveBeenCalledWith('Chou Kaguya Hime');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ movie: mockMovie });
    });
  });

  describe('getPageBySlug', () => {
    it('should return page by slug', async () => {
      const mockPage = { title: 'Page' };
      fetchPageBySlug.mockResolvedValue(mockPage);
      const { req, res } = createMocksWithParams({ slug: 'test-slug' });

      await getPageBySlug(req, res);

      expect(fetchPageBySlug).toHaveBeenCalledWith('test-slug');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPage);
    });
  });
});
