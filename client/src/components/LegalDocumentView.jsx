import React, { useState } from 'react';
import { useLegalDocument } from '../hooks/useLegalDocument';
import '../styles/LegalPage.css';

const LegalDocumentView = ({ type }) => {
  const [lang, setLang] = useState('en');
  const { data, loading, error } = useLegalDocument(type, lang);

  if (loading) return <div className="legal-card" style={{ textAlign: 'center' }}>Loading...</div>;
  if (error) return <div className="legal-card" style={{ textAlign: 'center' }}>Error: {error}</div>;
  if (!data) return <div className="legal-card" style={{ textAlign: 'center' }}>Document not found.</div>;

  return (
    <div className="legal-card">
      <div className="legal-lang-toggle">
        <button 
          onClick={() => setLang('en')} 
          disabled={lang === 'en'}
          className="legal-lang-btn"
        >
          English
        </button>
        <button 
          onClick={() => setLang('vi')} 
          disabled={lang === 'vi'}
          className="legal-lang-btn"
        >
          Tiếng Việt
        </button>
      </div>
      
      <h1 className="legal-title">
        {type === 'TERMS_OF_USE' 
          ? (lang === 'vi' ? 'Điều khoản sử dụng' : 'Terms of Use') 
          : (lang === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy')}
      </h1>
      
      <div className="legal-meta">
        <span>Version: {data.version}</span>
        <span>•</span>
        <span>Effective: {new Date(data.effectiveDate).toLocaleDateString()}</span>
      </div>
      
      {data.summary && (
        <div className="legal-summary">
          <strong>Summary / Tóm tắt</strong>
          {data.summary}
        </div>
      )}
      
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  );
};

export default LegalDocumentView;
