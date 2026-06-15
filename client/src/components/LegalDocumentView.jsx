import React, { useState } from 'react';
import { useLegalDocument } from '../hooks/useLegalDocument';

const LegalDocumentView = ({ type }) => {
  const [lang, setLang] = useState('en');
  const { data, loading, error } = useLegalDocument(type, lang);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Document not found.</div>;

  return (
    <div className="legal-document" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="lang-toggle" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setLang('en')} 
          disabled={lang === 'en'}
          style={{ padding: '8px 16px', cursor: lang === 'en' ? 'default' : 'pointer' }}
        >
          English
        </button>
        <button 
          onClick={() => setLang('vi')} 
          disabled={lang === 'vi'}
          style={{ padding: '8px 16px', cursor: lang === 'vi' ? 'default' : 'pointer' }}
        >
          Tiếng Việt
        </button>
      </div>
      
      <h1 style={{ marginBottom: '10px' }}>
        {type === 'TERMS_OF_USE' ? (lang === 'vi' ? 'Điều khoản sử dụng' : 'Terms of Use') : (lang === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy')}
      </h1>
      
      <p className="meta" style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px' }}>
        Version: {data.version} | Effective: {new Date(data.effectiveDate).toLocaleDateString()}
      </p>
      
      {data.summary && (
        <div className="summary" style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>Summary:</strong> {data.summary}
        </div>
      )}
      
      <div className="content" dangerouslySetInnerHTML={{ __html: data.content }} style={{ lineHeight: '1.6' }} />
    </div>
  );
};

export default LegalDocumentView;
