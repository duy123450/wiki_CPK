const { getLegalDocument } = require('../../modules/legal/legal.controller');
const { fetchLegalDocument } = require('../../modules/legal/legal.service');

jest.mock('../../modules/legal/legal.service');

describe('Legal Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: { type: 'TERMS_OF_USE' },
      query: {},
      headers: {}
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getLegalDocument', () => {
    it('should return 404 if document is not found', async () => {
      fetchLegalDocument.mockResolvedValue(null);

      await getLegalDocument(mockReq, mockRes);

      expect(fetchLegalDocument).toHaveBeenCalledWith('TERMS_OF_USE', 'en');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it('should return document data correctly formatted', async () => {
      const mockDoc = {
        type: 'TERMS_OF_USE',
        version: '1.0',
        effectiveDate: '2023-01-01T00:00:00.000Z',
        locales: {
          en: {
            summary: 'Summary en',
            content: 'Content en'
          }
        }
      };

      fetchLegalDocument.mockResolvedValue(mockDoc);

      await getLegalDocument(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        type: 'TERMS_OF_USE',
        version: '1.0',
        effectiveDate: '2023-01-01T00:00:00.000Z',
        summary: 'Summary en',
        content: 'Content en'
      });
    });

    it('should return 500 on server error', async () => {
      fetchLegalDocument.mockRejectedValue(new Error('DB error'));

      await getLegalDocument(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
    });

    it('should respect lang=en query parameter and call service with en', async () => {
      mockReq.query = { lang: 'en' };
      const mockDoc = {
        type: 'TERMS_OF_USE',
        version: '1.0',
        effectiveDate: '2023-01-01T00:00:00.000Z',
        locales: {
          en: { summary: 'Summary en', content: 'Content en' }
        }
      };
      fetchLegalDocument.mockResolvedValue(mockDoc);

      await getLegalDocument(mockReq, mockRes);

      expect(fetchLegalDocument).toHaveBeenCalledWith('TERMS_OF_USE', 'en');
    });
  });
});
