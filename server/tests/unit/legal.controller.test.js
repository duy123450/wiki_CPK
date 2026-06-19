const { getLegalDocument } = require('../../modules/legal/legal.controller');
const { fetchLegalDocument } = require('../../modules/legal/legal.service');
const { createMocksWithParams, createMocksWithQuery } = require('../utils/mockFactory');

jest.mock('../../modules/legal/legal.service');

describe('Legal Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLegalDocument', () => {
    it('should return 404 if document is not found', async () => {
      fetchLegalDocument.mockResolvedValue(null);
      const { req, res } = createMocksWithParams({ type: 'TERMS_OF_USE' });

      await getLegalDocument(req, res);

      expect(fetchLegalDocument).toHaveBeenCalledWith('TERMS_OF_USE', 'en');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
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
      const { req, res } = createMocksWithParams({ type: 'TERMS_OF_USE' });

      await getLegalDocument(req, res);

      expect(res.json).toHaveBeenCalledWith({
        type: 'TERMS_OF_USE',
        version: '1.0',
        effectiveDate: '2023-01-01T00:00:00.000Z',
        summary: 'Summary en',
        content: 'Content en'
      });
    });

    it('should return 500 on server error', async () => {
      fetchLegalDocument.mockRejectedValue(new Error('DB error'));
      const { req, res } = createMocksWithParams({ type: 'TERMS_OF_USE' });

      await getLegalDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });

    it('should respect lang=en query parameter and call service with en', async () => {
      const mockDoc = {
        type: 'TERMS_OF_USE',
        version: '1.0',
        effectiveDate: '2023-01-01T00:00:00.000Z',
        locales: {
          en: { summary: 'Summary en', content: 'Content en' }
        }
      };
      fetchLegalDocument.mockResolvedValue(mockDoc);
      const { req, res } = createMocksWithParams(
        { type: 'TERMS_OF_USE' },
        { query: { lang: 'en' } }
      );

      await getLegalDocument(req, res);

      expect(fetchLegalDocument).toHaveBeenCalledWith('TERMS_OF_USE', 'en');
    });
  });
});
