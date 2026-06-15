const LegalDocument = require('./legal-document.model');

const fetchLegalDocument = async (type, lang) => {
  const document = await LegalDocument.findOne({ 
    type: type.toUpperCase(), 
    isPublished: true 
  })
  .sort({ effectiveDate: -1 })
  .select(`type version effectiveDate locales.${lang}`);

  return document;
};

module.exports = {
  fetchLegalDocument
};
