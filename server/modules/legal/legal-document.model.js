const mongoose = require('mongoose');

const LocalizedContentSchema = new mongoose.Schema({
  summary: { type: String, trim: true },
  content: { type: String, required: true },
}, { _id: false });

const LegalDocumentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['TERMS_OF_USE', 'PRIVACY_POLICY'], 
    required: true,
    index: true 
  },
  version: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  isPublished: { type: Boolean, default: false, index: true },
  locales: {
    en: { type: LocalizedContentSchema, required: true },
    vi: { type: LocalizedContentSchema, required: true },
  }
}, { timestamps: true });

LegalDocumentSchema.index({ type: 1, isPublished: 1, effectiveDate: -1 });

module.exports = mongoose.model('LegalDocument', LegalDocumentSchema);
