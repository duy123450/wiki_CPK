import React, { useState } from 'react';
import { useLegalDocument } from '../hooks/useLegalDocument';
import '../styles/LegalPage.css';

const legalCardClassName =
  'relative z-[1] mx-auto max-w-[840px] rounded-2xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.03)] p-[clamp(20px,5vw,40px)] shadow-[0_24px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(192,132,252,0.05)] [backdrop-filter:blur(16px)] [-webkit-backdrop-filter:blur(16px)]';

const languageButtonClassName =
  'cursor-pointer rounded-[6px] border border-solid border-[rgba(180,140,255,0.15)] bg-[rgba(255,255,255,0.02)] px-4 py-2 font-[Inter,sans-serif] text-[10px] tracking-[0.14em] text-[rgba(240,232,255,0.6)] uppercase transition-[all] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] enabled:hover:border-[rgba(192,132,252,0.4)] enabled:hover:bg-[rgba(255,255,255,0.06)] enabled:hover:text-white disabled:cursor-default disabled:border-[#c084fc] disabled:bg-[rgba(192,132,252,0.12)] disabled:text-[#c084fc] disabled:shadow-[0_0_10px_rgba(192,132,252,0.15)]';

const LegalDocumentView = ({ type }) => {
  const [lang, setLang] = useState('en');
  const { data, loading, error } = useLegalDocument(type, lang);

  if (loading) return <div className={`${legalCardClassName} text-center`}>Loading...</div>;
  if (error) return <div className={`${legalCardClassName} text-center`}>Error: {error}</div>;
  if (!data) return <div className={`${legalCardClassName} text-center`}>Document not found.</div>;

  return (
    <div className={legalCardClassName}>
      <div className="mb-6 flex gap-2">
        <button 
          onClick={() => setLang('en')} 
          disabled={lang === 'en'}
          className={languageButtonClassName}
        >
          English
        </button>
        <button 
          onClick={() => setLang('vi')} 
          disabled={lang === 'vi'}
          className={languageButtonClassName}
        >
          Tiếng Việt
        </button>
      </div>
      
      <h1 className="m-0 mb-[6px] font-['Inter',sans-serif] text-[clamp(24px,4vw,36px)] leading-[1.2] font-bold text-white [text-shadow:0_0_40px_rgba(192,132,252,0.3)]">
        {type === 'TERMS_OF_USE' 
          ? (lang === 'vi' ? 'Điều khoản sử dụng' : 'Terms of Use') 
          : (lang === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy')}
      </h1>
      
      <div className="mb-7 flex gap-3 border-b border-solid border-[rgba(180,140,255,0.1)] pb-[14px] font-['Inter',sans-serif] text-[11px] tracking-[0.05em] text-[rgba(240,232,255,0.45)]">
        <span>Version: {data.version}</span>
        <span>•</span>
        <span>Effective: {new Date(data.effectiveDate).toLocaleDateString()}</span>
      </div>
      
      {data.summary && (
        <div className="mb-8 rounded-[4px] border-l-[3px] border-solid border-l-[#c084fc] bg-[rgba(192,132,252,0.05)] px-5 py-4 text-[13.5px] leading-[1.6] text-[rgba(240,232,255,0.8)]">
          <strong className="mb-1 block font-['Inter',sans-serif] text-[11px] tracking-[0.1em] text-[#c084fc] uppercase">
            Summary / Tóm tắt
          </strong>
          {data.summary}
        </div>
      )}
      
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  );
};

export default LegalDocumentView;
