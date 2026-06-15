const { fetchSidebarData, fetchMovieData, fetchPageBySlug } = require('../../modules/wiki/wiki.service');
const { getSidebar, getMovieInfo, getPageBySlug } = require('../../modules/wiki/wiki.controller');

jest.mock('../../modules/wiki/wiki.service');

describe('Wiki Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getSidebar', () => {
    it('should return categories', async () => {
      const mockCategories = [{ name: 'Test' }];
      fetchSidebarData.mockResolvedValue(mockCategories);

      await getSidebar(mockReq, mockRes, mockNext);

      expect(fetchSidebarData).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ categories: mockCategories });
    });
  });

  describe('getMovieInfo', () => {
    it('should return movie info', async () => {
      const mockMovie = { title: 'Movie' };
      fetchMovieData.mockResolvedValue(mockMovie);

      await getMovieInfo(mockReq, mockRes, mockNext);

      expect(fetchMovieData).toHaveBeenCalledWith('Chou Kaguya Hime');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ movie: mockMovie });
    });
  });

  describe('getPageBySlug', () => {
    it('should return page by slug', async () => {
      const mockPage = { title: 'Page' };
      mockReq.params.slug = 'test-slug';
      fetchPageBySlug.mockResolvedValue(mockPage);

      await getPageBySlug(mockReq, mockRes, mockNext);

      expect(fetchPageBySlug).toHaveBeenCalledWith('test-slug');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPage);
    });
  });
});
