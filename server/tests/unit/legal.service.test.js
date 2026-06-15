const { fetchLegalDocument } = require('../../modules/legal/legal.service');
const LegalDocument = require('../../modules/legal/legal-document.model');

jest.mock('../../modules/legal/legal-document.model');

describe('Legal Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLegalDocument', () => {
    it('should fetch and format legal document', async () => {
      const mockDoc = {
        type: 'TERMS_OF_USE',
        version: '1.0',
        effectiveDate: new Date('2023-01-01'),
        locales: { en: { summary: 'Sum', content: 'Cont' } }
      };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockDoc)
      };

      LegalDocument.findOne.mockReturnValue(mockQuery);

      const result = await fetchLegalDocument('terms_of_use', 'en');

      expect(LegalDocument.findOne).toHaveBeenCalledWith({
        type: 'TERMS_OF_USE',
        isPublished: true
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ effectiveDate: -1 });
      expect(mockQuery.select).toHaveBeenCalledWith('type version effectiveDate locales.en');
      expect(result).toEqual(mockDoc);
    });

    it('should return null if not found', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(null)
      };

      LegalDocument.findOne.mockReturnValue(mockQuery);

      const result = await fetchLegalDocument('unknown', 'en');

      expect(result).toBeNull();
    });
  });
});
