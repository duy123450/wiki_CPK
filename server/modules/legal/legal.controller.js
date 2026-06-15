const { fetchLegalDocument } = require('./legal.service');

exports.getLegalDocument = async (req, res) => {
  try {
    const { type } = req.params;
    let lang = req.query.lang;
    if (!lang) {
      lang = req.headers['accept-language']?.startsWith('vi') ? 'vi' : 'en';
    }

    const document = await fetchLegalDocument(type, lang);

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
