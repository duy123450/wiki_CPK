const LegalDocument = require('./legal-document.model');

exports.getLegalDocument = async (req, res) => {
  try {
    const { type } = req.params;
    const lang = req.query.lang || req.headers['accept-language']?.startsWith('vi') ? 'vi' : 'en';

    const document = await LegalDocument.findOne({ 
      type: type.toUpperCase(), 
      isPublished: true 
    })
    .sort({ effectiveDate: -1 })
    .select(`version effectiveDate locales.${lang}`);

    if (!document) return res.status(404).json({ error: 'Not found' });

    res.json({
      type: document.type,
      version: document.version,
      effectiveDate: document.effectiveDate,
      summary: document.locales[lang]?.summary,
      content: document.locales[lang]?.content
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
